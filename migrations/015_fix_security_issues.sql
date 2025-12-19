-- ============================================================================
-- Migración 015: Corrección de Problemas de Seguridad Críticos
-- ============================================================================
-- Esta migración corrige:
-- 1. Vista event_financial_summary (SECURITY DEFINER → SECURITY INVOKER)
-- 2. Habilita RLS en tablas de historial (quotes_history, quote_items_history)
-- 3. Agrega search_path a todas las funciones para prevenir inyección SQL
-- 4. Asegura que servicios y personal solo sean accesibles por admins
-- ============================================================================

-- ============================================================================
-- 1. Corregir Vista event_financial_summary
-- ============================================================================

-- Primero, verificar si la vista existe y eliminarla si es necesario
DROP VIEW IF EXISTS public.event_financial_summary CASCADE;

-- Recrear la vista con SECURITY INVOKER (más seguro)
CREATE VIEW public.event_financial_summary
WITH (security_invoker = true)
AS
SELECT 
  e.id AS event_id,
  COALESCE(SUM(
    CASE
      WHEN l.type = 'INCOME'::ledger_type THEN l.amount
      ELSE NULL::numeric
    END), 0::numeric) AS total_income,
  COALESCE(SUM(
    CASE
      WHEN l.type = 'EXPENSE'::ledger_type THEN l.amount
      ELSE NULL::numeric
    END), 0::numeric) AS total_expense,
  COALESCE(SUM(
    CASE
      WHEN l.type = 'COMMISSION'::ledger_type THEN l.amount
      ELSE NULL::numeric
    END), 0::numeric) AS commission_paid,
  COALESCE(SUM(
    CASE
      WHEN l.type = 'INCOME'::ledger_type THEN l.amount
      ELSE NULL::numeric
    END), 0::numeric) - 
  COALESCE(SUM(
    CASE
      WHEN l.type = 'EXPENSE'::ledger_type THEN l.amount
      ELSE NULL::numeric
    END), 0::numeric) - 
  COALESCE(SUM(
    CASE
      WHEN l.type = 'COMMISSION'::ledger_type THEN l.amount
      ELSE NULL::numeric
    END), 0::numeric) AS net_profit
FROM events e
LEFT JOIN finance_ledger l ON l.event_id = e.id
GROUP BY e.id;

COMMENT ON VIEW public.event_financial_summary IS 'Resumen financiero de eventos. Usa SECURITY INVOKER para aplicar RLS correctamente.';

-- ============================================================================
-- 2. Habilitar RLS en Tablas de Historial
-- ============================================================================

-- Habilitar RLS en quotes_history
ALTER TABLE public.quotes_history ENABLE ROW LEVEL SECURITY;

-- Política: Solo admins pueden ver el historial de cotizaciones
DROP POLICY IF EXISTS "Admins can view quotes history" ON public.quotes_history;
CREATE POLICY "Admins can view quotes history"
ON public.quotes_history
FOR SELECT
USING (public.is_admin());

-- Habilitar RLS en quote_items_history
ALTER TABLE public.quote_items_history ENABLE ROW LEVEL SECURITY;

-- Política: Solo admins pueden ver el historial de items de cotizaciones
DROP POLICY IF EXISTS "Admins can view quote items history" ON public.quote_items_history;
CREATE POLICY "Admins can view quote items history"
ON public.quote_items_history
FOR SELECT
USING (public.is_admin());

-- ============================================================================
-- 3. Agregar search_path a Todas las Funciones
-- ============================================================================

-- Función: get_total_paid
CREATE OR REPLACE FUNCTION get_total_paid(quote_uuid UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  total_paid DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM partial_payments
  WHERE quote_id = quote_uuid;
  
  RETURN total_paid;
END;
$$;

-- Función: get_balance_due
CREATE OR REPLACE FUNCTION get_balance_due(quote_uuid UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  total_price DECIMAL(10,2);
  total_paid DECIMAL(10,2);
BEGIN
  SELECT COALESCE(total_amount, 0) INTO total_price
  FROM quotes
  WHERE id = quote_uuid;
  
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM partial_payments
  WHERE quote_id = quote_uuid;
  
  RETURN GREATEST(total_price - total_paid, 0);
END;
$$;

-- Función: is_admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Primero intentar obtener el rol del JWT (más rápido, sin consultar DB)
  RETURN COALESCE(
    (auth.jwt() ->> 'user_role') = 'admin',
    false
  );
END;
$$;

-- Función: is_vendor
CREATE OR REPLACE FUNCTION is_vendor()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (auth.jwt() ->> 'user_role') = 'vendor' 
    OR EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'vendor'
    );
END;
$$;

-- Función: confirm_sale
CREATE OR REPLACE FUNCTION confirm_sale(p_quote_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_vendor UUID;
  v_role user_role;
  v_margin NUMERIC := 0;
  v_total NUMERIC := 0;
  v_commission NUMERIC := 0;
  v_commission_rate NUMERIC := 0;
  v_event_id UUID;
BEGIN
  -- Lock and fetch quote
  SELECT vendor_id INTO v_vendor
  FROM public.quotes
  WHERE id = p_quote_id
  FOR UPDATE;

  IF v_vendor IS NULL THEN
    RAISE EXCEPTION 'Quote % not found', p_quote_id;
  END IF;

  -- Get vendor role and commission_rate
  SELECT role, commission_rate INTO v_role, v_commission_rate
  FROM public.profiles
  WHERE id = v_vendor;

  -- Authorization: caller must be vendor owner or admin
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: no auth.uid()';
  END IF;

  IF auth.uid() <> v_vendor THEN
    -- check admin
    IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin') THEN
      RAISE EXCEPTION 'Not authorized to confirm this quote';
    END IF;
  END IF;

  -- compute margin and total
  SELECT COALESCE(SUM((unit_price - unit_cost) * quantity),0),
         COALESCE(SUM(unit_price * quantity),0)
  INTO v_margin, v_total
  FROM public.quote_items
  WHERE quote_id = p_quote_id;

  -- update quote status and financials
  UPDATE public.quotes
  SET status = 'APPROVED',
      total_amount = v_total,
      estimated_profit = v_margin,
      updated_at = NOW(),
      version = version + 1
  WHERE id = p_quote_id;

  -- create event
  INSERT INTO public.events (quote_id, start_date, created_at)
  VALUES (p_quote_id, (SELECT event_date FROM public.quotes WHERE id = p_quote_id), NOW())
  RETURNING id INTO v_event_id;

  -- ledger entries
  INSERT INTO public.finance_ledger(event_id, type, amount, description, created_at)
  VALUES (v_event_id, 'INCOME', v_total, concat('Income for quote ', p_quote_id), NOW());

  v_commission := ROUND(COALESCE(v_margin,0) * COALESCE(v_commission_rate,0), 2);

  IF v_commission > 0 THEN
    INSERT INTO public.finance_ledger(event_id, type, amount, description, created_at)
    VALUES (v_event_id, 'COMMISSION', v_commission, concat('Commission for vendor ', v_vendor, ' on quote ', p_quote_id), NOW());
  END IF;

  RETURN v_event_id;
END;
$$;

-- Función: create_notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Validar tipo
  IF p_type NOT IN ('quote', 'event', 'payment', 'reminder', 'system') THEN
    RAISE EXCEPTION 'Invalid notification type: %', p_type;
  END IF;

  -- Insertar notificación
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_metadata)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Función: get_quote_history
-- Primero eliminar si existe con diferente firma
DROP FUNCTION IF EXISTS get_quote_history(UUID);

CREATE FUNCTION get_quote_history(quote_uuid UUID)
RETURNS TABLE (
  version_number INT,
  status VARCHAR,
  total_price NUMERIC,
  services JSONB,
  created_by_name TEXT,
  created_at TIMESTAMP
)
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    qv.version_number,
    qv.status,
    qv.total_price,
    qv.services,
    p.full_name::TEXT,
    qv.created_at
  FROM quote_versions qv
  LEFT JOIN profiles p ON p.id = qv.created_by
  WHERE qv.quote_id = quote_uuid
  ORDER BY qv.version_number DESC;
END;
$$;

-- Función: get_record_audit_trail
CREATE OR REPLACE FUNCTION get_record_audit_trail(
  p_table_name VARCHAR,
  p_record_id UUID,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  action VARCHAR,
  table_name VARCHAR,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ,
  user_email TEXT
)
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.user_id,
    al.action,
    al.table_name,
    al.old_values,
    al.new_values,
    al.ip_address,
    al.user_agent,
    al.created_at,
    u.email::TEXT
  FROM public.audit_logs al
  LEFT JOIN auth.users u ON al.user_id = u.id
  WHERE al.table_name = p_table_name
    AND (
      al.new_values->>'id' = p_record_id::TEXT
      OR al.old_values->>'id' = p_record_id::TEXT
    )
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Función: get_user_activity
CREATE OR REPLACE FUNCTION get_user_activity(
  p_user_id UUID,
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  action VARCHAR,
  table_name VARCHAR,
  count BIGINT,
  last_activity TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.action,
    al.table_name,
    COUNT(*)::BIGINT as count,
    MAX(al.created_at) as last_activity
  FROM public.audit_logs al
  WHERE al.user_id = p_user_id
    AND al.created_at > NOW() - INTERVAL '1 day' * p_days
  GROUP BY al.action, al.table_name
  ORDER BY MAX(al.created_at) DESC;
END;
$$;

-- Función: create_initial_quote_version
CREATE OR REPLACE FUNCTION create_initial_quote_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO quote_versions (
    quote_id,
    version_number,
    status,
    total_price,
    client_id,
    services,
    notes,
    created_by,
    created_at
  ) VALUES (
    NEW.id,
    1,
    NEW.status,
    NEW.total_amount,
    NEW.client_id,
    (
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'service_id', qs.service_id,
              'quantity', qs.quantity,
              'final_price', qs.final_price
            )
          )
          FROM quote_services qs
          WHERE qs.quote_id = NEW.id
        ), '[]'::jsonb
      )
    ),
    NULL,
    COALESCE(auth.uid(), NEW.vendor_id),
    CURRENT_TIMESTAMP
  );
  RETURN NEW;
END;
$$;

-- Función: create_quote_version_on_update
CREATE OR REPLACE FUNCTION create_quote_version_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  max_version INT;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) INTO max_version
  FROM quote_versions
  WHERE quote_id = NEW.id;
  
  IF OLD.status IS DISTINCT FROM NEW.status OR 
     OLD.total_amount IS DISTINCT FROM NEW.total_amount THEN
    INSERT INTO quote_versions (
      quote_id,
      version_number,
      status,
      total_price,
      client_id,
      services,
      notes,
      created_by,
      created_at
    ) VALUES (
      NEW.id,
      max_version + 1,
      NEW.status,
      NEW.total_amount,
      NEW.client_id,
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'service_id', qs.service_id,
              'quantity', qs.quantity,
              'final_price', qs.final_price
            )
          )
          FROM quote_services qs
          WHERE qs.quote_id = NEW.id
        ), '[]'::jsonb
      ),
      NULL,
      COALESCE(auth.uid(), NEW.vendor_id),
      CURRENT_TIMESTAMP
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Función: compare_quote_versions
CREATE OR REPLACE FUNCTION compare_quote_versions(
  quote_uuid UUID,
  v1 INT,
  v2 INT
)
RETURNS TABLE (
  field_name TEXT,
  value_v1 TEXT,
  value_v2 TEXT,
  changed BOOLEAN
)
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH v1_data AS (
    SELECT * FROM quote_versions WHERE quote_id = quote_uuid AND version_number = v1
  ),
  v2_data AS (
    SELECT * FROM quote_versions WHERE quote_id = quote_uuid AND version_number = v2
  )
  SELECT
    'status'::TEXT,
    (SELECT status FROM v1_data)::TEXT,
    (SELECT status FROM v2_data)::TEXT,
    (SELECT status FROM v1_data) IS DISTINCT FROM (SELECT status FROM v2_data)
  UNION ALL
  SELECT
    'total_price'::TEXT,
    (SELECT total_price::TEXT FROM v1_data),
    (SELECT total_price::TEXT FROM v2_data),
    (SELECT total_price FROM v1_data) IS DISTINCT FROM (SELECT total_price FROM v2_data)
  UNION ALL
  SELECT
    'services'::TEXT,
    (SELECT services::TEXT FROM v1_data),
    (SELECT services::TEXT FROM v2_data),
    (SELECT services FROM v1_data) IS DISTINCT FROM (SELECT services FROM v2_data)
  ORDER BY changed DESC, field_name;
END;
$$;

-- Función: prevent_overlapping_events
CREATE OR REPLACE FUNCTION prevent_overlapping_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  event_start DATE;
  event_end DATE;
BEGIN
  -- Validar que start_date no sea null
  IF NEW.start_date IS NULL THEN
    RAISE EXCEPTION 'start_date no puede ser null';
  END IF;
  
  -- Si end_date es null, usar start_date como end_date
  event_start := NEW.start_date;
  event_end := COALESCE(NEW.end_date, NEW.start_date);
  
  -- Verificar solapamientos con otros eventos de la misma cotización
  IF EXISTS (
    SELECT 1 FROM events
    WHERE quote_id = NEW.quote_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND (
      -- El nuevo evento empieza dentro de un evento existente
      (event_start BETWEEN start_date AND COALESCE(end_date, start_date))
      -- El nuevo evento termina dentro de un evento existente
      OR (event_end BETWEEN start_date AND COALESCE(end_date, start_date))
      -- El nuevo evento contiene completamente un evento existente
      OR (start_date BETWEEN event_start AND event_end)
    )
  ) THEN
    RAISE EXCEPTION 'Ya existe un evento para esta cotización en estas fechas. Las fechas se solapan con un evento existente.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Función: validate_api_key
CREATE OR REPLACE FUNCTION validate_api_key(api_key_hash TEXT)
RETURNS TABLE (
  user_id UUID,
  permissions TEXT[],
  is_valid BOOLEAN
)
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ak.user_id,
    ak.permissions,
    CASE 
      WHEN ak.is_active = true 
        AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
      THEN true
      ELSE false
    END as is_valid
  FROM api_keys ak
  WHERE ak.key_hash = api_key_hash
  LIMIT 1;
END;
$$;

-- Funciones de triggers (updated_at)
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_partial_payments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_quote_templates_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 4. Asegurar que Servicios solo sean accesibles por Admins
-- ============================================================================

-- Verificar y actualizar políticas RLS de services
-- Solo admins pueden crear, actualizar o eliminar servicios
-- Todos pueden leer (necesario para cotizaciones)

DROP POLICY IF EXISTS "Admins can create services" ON public.services;
CREATE POLICY "Admins can create services"
ON public.services
FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update services" ON public.services;
CREATE POLICY "Admins can update services"
ON public.services
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete services" ON public.services;
CREATE POLICY "Admins can delete services"
ON public.services
FOR DELETE
USING (public.is_admin());

-- ============================================================================
-- 5. Asegurar que Gestión de Personal solo sea accesible por Admins
-- ============================================================================

-- Las políticas de profiles ya están configuradas en migración 014
-- Solo verificamos que existan

-- Política para que admins puedan ver todos los perfiles (ya debería existir)
-- Si no existe, la creamos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles"
    ON public.profiles
    FOR SELECT
    USING (public.is_admin());
  END IF;
END $$;

-- Política para que admins puedan actualizar roles (ya debería existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Admins can update any profile role'
  ) THEN
    CREATE POLICY "Admins can update any profile role"
    ON public.profiles
    FOR UPDATE
    WITH CHECK (public.is_admin());
  END IF;
END $$;

-- ============================================================================
-- Comentarios
-- ============================================================================

COMMENT ON FUNCTION get_total_paid(UUID) IS 'Calcula el total pagado de una cotización. Configurado con search_path para seguridad.';
COMMENT ON FUNCTION get_balance_due(UUID) IS 'Calcula el saldo pendiente de una cotización. Configurado con search_path para seguridad.';
COMMENT ON FUNCTION is_admin() IS 'Verifica si el usuario actual es admin. Configurado con search_path para seguridad.';
COMMENT ON FUNCTION is_vendor() IS 'Verifica si el usuario actual es vendedor. Configurado con search_path para seguridad.';

