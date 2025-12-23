-- ============================================================================
-- Migración 031: Corrección de Problemas Críticos de Seguridad
-- ============================================================================
-- Fecha: 2025-12-23
-- Descripción: 
--   1. Cambiar vistas de SECURITY DEFINER a SECURITY INVOKER
--   2. Habilitar RLS en tablas sin protección
--   3. Configurar search_path en funciones sin configuración
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTE 1: Cambiar vistas de SECURITY DEFINER a SECURITY INVOKER
-- ============================================================================

-- 1. owner_dashboard_kpis
DROP VIEW IF EXISTS public.owner_dashboard_kpis CASCADE;
CREATE VIEW public.owner_dashboard_kpis
WITH (security_invoker = true)
AS
SELECT 
  COALESCE(sum(q.total_amount) FILTER (WHERE ((q.status = 'APPROVED'::quote_status) AND (date_trunc('month'::text, q.created_at) = date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone)))), (0)::numeric) AS monthly_sales,
  COALESCE(sum((q.total_amount - COALESCE(( SELECT sum(pp.amount) AS sum
         FROM partial_payments pp
        WHERE (pp.quote_id = q.id)), (0)::numeric))) FILTER (WHERE (q.status = 'APPROVED'::quote_status)), (0)::numeric) AS money_to_collect,
  count(DISTINCT e.id) FILTER (WHERE (((e.start_date >= CURRENT_DATE) AND (e.start_date <= (CURRENT_DATE + '7 days'::interval))) AND (e.status <> ALL (ARRAY['CANCELLED'::event_status, 'NO_SHOW'::event_status])))) AS events_next_7_days,
  count(DISTINCT e.id) FILTER (WHERE (((e.start_date >= CURRENT_DATE) AND (e.start_date <= (CURRENT_DATE + '30 days'::interval))) AND (e.status <> ALL (ARRAY['CANCELLED'::event_status, 'NO_SHOW'::event_status])))) AS events_next_30_days,
  count(DISTINCT e.id) FILTER (WHERE (((e.start_date >= CURRENT_DATE) AND (e.start_date <= (CURRENT_DATE + '90 days'::interval))) AND (e.status <> ALL (ARRAY['CANCELLED'::event_status, 'NO_SHOW'::event_status])))) AS events_next_90_days,
  count(DISTINCT q.id) FILTER (WHERE ((q.status = 'APPROVED'::quote_status) AND (EXISTS ( SELECT 1
         FROM partial_payments pp
        WHERE ((pp.quote_id = q.id) AND (pp.due_date < CURRENT_DATE) AND (pp.amount > (0)::numeric)))))) AS events_at_risk,
  count(DISTINCT e.id) FILTER (WHERE (e.status = 'CONFIRMED'::event_status)) AS confirmed_events_count,
  count(DISTINCT e.id) FILTER (WHERE ((e.status = ANY (ARRAY['LOGISTICS'::event_status, 'IN_PROGRESS'::event_status])) AND (EXISTS ( SELECT 1
         FROM (quotes q2
           JOIN partial_payments pp ON ((pp.quote_id = q2.id)))
        WHERE ((q2.id = e.quote_id) AND (pp.due_date < CURRENT_DATE)))))) AS events_at_risk_count
FROM (quotes q
  LEFT JOIN events e ON ((e.quote_id = q.id)));

-- 2. vendor_performance
DROP VIEW IF EXISTS public.vendor_performance CASCADE;
CREATE VIEW public.vendor_performance
WITH (security_invoker = true)
AS
SELECT 
  p.id AS vendor_id,
  p.full_name AS vendor_name,
  p.role,
  count(DISTINCT q.id) FILTER (WHERE (q.status = 'APPROVED'::quote_status)) AS confirmed_quotes,
  count(DISTINCT q.id) FILTER (WHERE (q.status = 'DRAFT'::quote_status)) AS draft_quotes,
  COALESCE(sum(q.total_amount) FILTER (WHERE (q.status = 'APPROVED'::quote_status)), (0)::numeric) AS total_sales,
  COALESCE(sum(q.total_amount) FILTER (WHERE ((q.status = 'APPROVED'::quote_status) AND (date_trunc('month'::text, q.created_at) = date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone)))), (0)::numeric) AS monthly_sales,
  COALESCE(avg(q.total_amount) FILTER (WHERE (q.status = 'APPROVED'::quote_status)), (0)::numeric) AS average_sale,
      CASE
          WHEN (count(DISTINCT q.id) > 0) THEN (((count(DISTINCT q.id) FILTER (WHERE (q.status = 'APPROVED'::quote_status)))::numeric / (count(DISTINCT q.id))::numeric) * (100)::numeric)
          ELSE (0)::numeric
      END AS conversion_rate,
  (COALESCE(sum(q.total_amount) FILTER (WHERE (q.status = 'APPROVED'::quote_status)), (0)::numeric) * COALESCE(p.commission_rate, 0.10)) AS total_commissions
FROM (profiles p
  LEFT JOIN quotes q ON ((q.vendor_id = p.id)))
WHERE (p.role = 'vendor'::user_role)
GROUP BY p.id, p.full_name, p.role, p.commission_rate
ORDER BY COALESCE(sum(q.total_amount) FILTER (WHERE (q.status = 'APPROVED'::quote_status)), (0)::numeric) DESC;

-- 3. date_profitability_analysis
DROP VIEW IF EXISTS public.date_profitability_analysis CASCADE;
CREATE VIEW public.date_profitability_analysis
WITH (security_invoker = true)
AS
SELECT 
  e.start_date AS event_date,
  count(DISTINCT e.id) AS events_count,
  count(DISTINCT e.id) FILTER (WHERE (e.status = 'CONFIRMED'::event_status)) AS confirmed_count,
  count(DISTINCT e.id) FILTER (WHERE (e.status = ANY (ARRAY['LOGISTICS'::event_status, 'IN_PROGRESS'::event_status]))) AS reserved_count,
  COALESCE(sum(q.total_amount) FILTER (WHERE (e.status = 'CONFIRMED'::event_status)), (0)::numeric) AS total_revenue,
  COALESCE(sum(( SELECT COALESCE(sum((qs.final_price - (s.cost_price * (qs.quantity)::numeric))), (0)::numeric) AS "coalesce"
         FROM (quote_services qs
           JOIN services s ON ((s.id = qs.service_id)))
        WHERE (qs.quote_id = q.id))) FILTER (WHERE (e.status = 'CONFIRMED'::event_status)), (0)::numeric) AS total_profit,
      CASE
          WHEN (count(DISTINCT e.id) FILTER (WHERE (e.status = 'CONFIRMED'::event_status)) > 0) THEN (COALESCE(sum(q.total_amount) FILTER (WHERE (e.status = 'CONFIRMED'::event_status)), (0)::numeric) / (count(DISTINCT e.id) FILTER (WHERE (e.status = 'CONFIRMED'::event_status)))::numeric)
          ELSE (0)::numeric
      END AS average_revenue_per_event,
      CASE
          WHEN (count(DISTINCT e.id) FILTER (WHERE (e.status = 'CONFIRMED'::event_status)) > 0) THEN (COALESCE(sum(( SELECT COALESCE(sum((qs.final_price - (s.cost_price * (qs.quantity)::numeric))), (0)::numeric) AS "coalesce"
             FROM (quote_services qs
               JOIN services s ON ((s.id = qs.service_id)))
            WHERE (qs.quote_id = q.id))) FILTER (WHERE (e.status = 'CONFIRMED'::event_status)), (0)::numeric) / (count(DISTINCT e.id) FILTER (WHERE (e.status = 'CONFIRMED'::event_status)))::numeric)
          ELSE (0)::numeric
      END AS average_profit_per_event
FROM (events e
  JOIN quotes q ON ((q.id = e.quote_id)))
WHERE (e.start_date >= (CURRENT_DATE - '1 year'::interval))
GROUP BY e.start_date
ORDER BY e.start_date DESC;

-- 4. monthly_comparison
DROP VIEW IF EXISTS public.monthly_comparison CASCADE;
CREATE VIEW public.monthly_comparison
WITH (security_invoker = true)
AS
SELECT 
  date_trunc('month'::text, created_at) AS month,
  count(DISTINCT id) FILTER (WHERE (status = 'APPROVED'::quote_status)) AS confirmed_quotes,
  COALESCE(sum(total_amount) FILTER (WHERE (status = 'APPROVED'::quote_status)), (0)::numeric) AS total_sales,
  COALESCE(sum(( SELECT COALESCE(sum((qs.final_price - (s.cost_price * (qs.quantity)::numeric))), (0)::numeric) AS "coalesce"
         FROM (quote_services qs
           JOIN services s ON ((s.id = qs.service_id)))
        WHERE (qs.quote_id = q.id))) FILTER (WHERE (status = 'APPROVED'::quote_status)), (0)::numeric) AS total_profit,
  count(DISTINCT client_id) FILTER (WHERE (status = 'APPROVED'::quote_status)) AS unique_clients
FROM quotes q
WHERE (created_at >= (CURRENT_DATE - '1 year'::interval))
GROUP BY (date_trunc('month'::text, created_at))
ORDER BY (date_trunc('month'::text, created_at)) DESC;

-- 5. financial_reports
DROP VIEW IF EXISTS public.financial_reports CASCADE;
CREATE VIEW public.financial_reports
WITH (security_invoker = true)
AS
SELECT 
  q.vendor_id,
  q.id AS quote_id,
  q.status,
  q.total_amount,
  q.created_at,
  COALESCE(sum(pp.amount) FILTER (WHERE (pp.is_deposit = false)), (0)::numeric) AS total_paid,
  COALESCE(sum(pp.amount) FILTER (WHERE (pp.is_deposit = true)), (0)::numeric) AS deposit_paid,
  (q.total_amount - COALESCE(sum(pp.amount), (0)::numeric)) AS balance_due,
  count(pp.id) FILTER (WHERE (pp.is_deposit = false)) AS payments_count,
  count(pp.id) FILTER (WHERE (pp.is_deposit = true)) AS deposits_count,
  COALESCE(( SELECT sum((qs.final_price - (s.cost_price * (qs.quantity)::numeric))) AS sum
         FROM (quote_services qs
           JOIN services s ON ((s.id = qs.service_id)))
        WHERE (qs.quote_id = q.id)), (0)::numeric) AS estimated_profit,
  (COALESCE(sum(pp.amount) FILTER (WHERE (pp.is_deposit = false)), (0)::numeric) * 0.10) AS estimated_commission
FROM (quotes q
  LEFT JOIN partial_payments pp ON ((pp.quote_id = q.id)))
GROUP BY q.id, q.vendor_id, q.status, q.total_amount, q.created_at;

-- 6. cash_flow_summary
DROP VIEW IF EXISTS public.cash_flow_summary CASCADE;
CREATE VIEW public.cash_flow_summary
WITH (security_invoker = true)
AS
SELECT 
  CURRENT_DATE AS report_date,
  COALESCE(sum(pp.amount) FILTER (WHERE (pp.is_deposit = true)), (0)::numeric) AS deposits_received,
  COALESCE(sum(pp.amount) FILTER (WHERE (pp.is_deposit = false)), (0)::numeric) AS payments_received,
  COALESCE(sum(pp.amount), (0)::numeric) AS total_received,
  COALESCE(sum((q.total_amount * 0.30)) FILTER (WHERE ((q.status = 'APPROVED'::quote_status) AND (NOT (EXISTS ( SELECT 1
         FROM partial_payments pp2
        WHERE ((pp2.quote_id = q.id) AND (pp2.is_deposit = true))))))), (0)::numeric) AS deposits_pending,
  COALESCE(sum(pp.amount) FILTER (WHERE ((pp.due_date > CURRENT_DATE) AND (pp.due_date <= (CURRENT_DATE + '30 days'::interval)))), (0)::numeric) AS payments_due_30_days,
  COALESCE(sum(pp.amount) FILTER (WHERE ((pp.due_date > CURRENT_DATE) AND (pp.due_date <= (CURRENT_DATE + '90 days'::interval)))), (0)::numeric) AS payments_due_90_days,
  COALESCE(sum(pp.amount) FILTER (WHERE (pp.due_date < CURRENT_DATE)), (0)::numeric) AS payments_overdue,
  COALESCE(sum((q.total_amount - COALESCE(( SELECT sum(pp2.amount) AS sum
         FROM partial_payments pp2
        WHERE (pp2.quote_id = q.id)), (0)::numeric))) FILTER (WHERE (q.status = 'APPROVED'::quote_status)), (0)::numeric) AS total_balance_due
FROM (quotes q
  LEFT JOIN partial_payments pp ON ((pp.quote_id = q.id)))
WHERE (q.status = 'APPROVED'::quote_status);

-- 7. cash_flow_projection
DROP VIEW IF EXISTS public.cash_flow_projection CASCADE;
CREATE VIEW public.cash_flow_projection
WITH (security_invoker = true)
AS
SELECT 
  date_trunc('day'::text, pp.payment_date) AS projection_date,
  'RECEIVED'::text AS flow_type,
  COALESCE(sum(pp.amount) FILTER (WHERE (pp.payment_date <= CURRENT_DATE)), (0)::numeric) AS received_amount,
  COALESCE(sum(pp.amount) FILTER (WHERE ((pp.payment_date > CURRENT_DATE) AND (pp.payment_date <= (CURRENT_DATE + '30 days'::interval)))), (0)::numeric) AS projected_30_days,
  COALESCE(sum(pp.amount) FILTER (WHERE ((pp.payment_date > (CURRENT_DATE + '30 days'::interval)) AND (pp.payment_date <= (CURRENT_DATE + '90 days'::interval)))), (0)::numeric) AS projected_90_days,
  count(*) FILTER (WHERE (pp.payment_date <= CURRENT_DATE)) AS received_count,
  count(*) FILTER (WHERE ((pp.payment_date > CURRENT_DATE) AND (pp.payment_date <= (CURRENT_DATE + '30 days'::interval)))) AS projected_30_count,
  count(*) FILTER (WHERE ((pp.payment_date > (CURRENT_DATE + '30 days'::interval)) AND (pp.payment_date <= (CURRENT_DATE + '90 days'::interval)))) AS projected_90_count
FROM (partial_payments pp
  JOIN quotes q ON ((q.id = pp.quote_id)))
WHERE (q.status = 'APPROVED'::quote_status)
GROUP BY (date_trunc('day'::text, pp.payment_date))
UNION ALL
SELECT 
  date_trunc('day'::text, pp.due_date) AS projection_date,
  'DUE'::text AS flow_type,
  0 AS received_amount,
  COALESCE(sum(pp.amount) FILTER (WHERE ((pp.due_date > CURRENT_DATE) AND (pp.due_date <= (CURRENT_DATE + '30 days'::interval)))), (0)::numeric) AS projected_30_days,
  COALESCE(sum(pp.amount) FILTER (WHERE ((pp.due_date > (CURRENT_DATE + '30 days'::interval)) AND (pp.due_date <= (CURRENT_DATE + '90 days'::interval)))), (0)::numeric) AS projected_90_days,
  0 AS received_count,
  count(*) FILTER (WHERE ((pp.due_date > CURRENT_DATE) AND (pp.due_date <= (CURRENT_DATE + '30 days'::interval)))) AS projected_30_count,
  count(*) FILTER (WHERE ((pp.due_date > (CURRENT_DATE + '30 days'::interval)) AND (pp.due_date <= (CURRENT_DATE + '90 days'::interval)))) AS projected_90_count
FROM (partial_payments pp
  JOIN quotes q ON ((q.id = pp.quote_id)))
WHERE ((q.status = 'APPROVED'::quote_status) AND (pp.due_date IS NOT NULL))
GROUP BY (date_trunc('day'::text, pp.due_date));

-- 8. calendar_availability
DROP VIEW IF EXISTS public.calendar_availability CASCADE;
CREATE VIEW public.calendar_availability
WITH (security_invoker = true)
AS
SELECT 
  date_series.date,
  count(e.id) FILTER (WHERE (e.status = 'CONFIRMED'::event_status)) AS confirmed_count,
  count(e.id) FILTER (WHERE (e.status = 'LOGISTICS'::event_status)) AS logistics_count,
  count(e.id) FILTER (WHERE (e.status = 'IN_PROGRESS'::event_status)) AS in_progress_count,
  count(e.id) FILTER (WHERE (e.status = ANY (ARRAY['CANCELLED'::event_status, 'NO_SHOW'::event_status]))) AS cancelled_count,
      CASE
          WHEN (count(e.id) FILTER (WHERE (e.status <> ALL (ARRAY['CANCELLED'::event_status, 'NO_SHOW'::event_status]))) = 0) THEN 'AVAILABLE'::text
          WHEN (count(e.id) FILTER (WHERE (e.status = 'CONFIRMED'::event_status)) > 0) THEN 'CONFIRMED'::text
          WHEN (count(e.id) FILTER (WHERE (e.status = ANY (ARRAY['LOGISTICS'::event_status, 'IN_PROGRESS'::event_status]))) > 0) THEN 'RESERVED'::text
          ELSE 'AVAILABLE'::text
      END AS availability_status
FROM (( SELECT (generate_series((CURRENT_DATE)::timestamp without time zone, (CURRENT_DATE + '1 year'::interval), '1 day'::interval))::date AS date) date_series
  LEFT JOIN events e ON (((date_series.date >= e.start_date) AND (date_series.date <= COALESCE(e.end_date, e.start_date)))))
GROUP BY date_series.date;

-- 9. quote_discount_summary
DROP VIEW IF EXISTS public.quote_discount_summary CASCADE;
CREATE VIEW public.quote_discount_summary
WITH (security_invoker = true)
AS
SELECT 
  q.id AS quote_id,
  q.total_amount AS original_total,
  COALESCE(sum(pcl.discount_amount), (0)::numeric) AS total_discounts,
  (q.total_amount - COALESCE(sum(pcl.discount_amount), (0)::numeric)) AS final_total,
  count(pcl.id) AS discount_count,
  max(pcl.created_at) AS last_discount_date,
  string_agg(DISTINCT p.full_name, ', '::text) AS authorized_by_names,
  string_agg(DISTINCT pcl.reason, ' | '::text) AS discount_reasons
FROM ((quotes q
  LEFT JOIN price_change_log pcl ON ((pcl.quote_id = q.id)))
  LEFT JOIN profiles p ON ((p.id = pcl.authorized_by)))
GROUP BY q.id, q.total_amount;

-- ============================================================================
-- PARTE 2: Habilitar RLS en tablas sin protección
-- ============================================================================

-- 1. template_versions
ALTER TABLE public.template_versions ENABLE ROW LEVEL SECURITY;

-- Políticas para template_versions
CREATE POLICY "template_versions_admin_all" ON public.template_versions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "template_versions_vendor_select" ON public.template_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'vendor'
    )
  );

-- 2. payment_reminders
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

-- Políticas para payment_reminders
CREATE POLICY "payment_reminders_admin_all" ON public.payment_reminders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "payment_reminders_vendor_select" ON public.payment_reminders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.quotes q ON q.vendor_id = p.id
      JOIN public.partial_payments pp ON pp.quote_id = q.id
      WHERE p.id = auth.uid() 
        AND p.role = 'vendor'
        AND payment_reminders.payment_id = pp.id
    )
  );

CREATE POLICY "payment_reminders_vendor_insert" ON public.payment_reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.partial_payments pp ON pp.created_by = p.id
      WHERE p.id = auth.uid() 
        AND p.role = 'vendor'
        AND payment_reminders.payment_id = pp.id
    )
  );

-- 3. price_change_log
ALTER TABLE public.price_change_log ENABLE ROW LEVEL SECURITY;

-- Políticas para price_change_log
CREATE POLICY "price_change_log_admin_all" ON public.price_change_log
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "price_change_log_vendor_select" ON public.price_change_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.quotes q ON q.vendor_id = p.id
      WHERE p.id = auth.uid() 
        AND p.role = 'vendor'
        AND price_change_log.quote_id = q.id
    )
  );

CREATE POLICY "price_change_log_vendor_insert" ON public.price_change_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.quotes q ON q.vendor_id = p.id
      WHERE p.id = auth.uid() 
        AND p.role = 'vendor'
        AND price_change_log.quote_id = q.id
    )
  );

-- ============================================================================
-- PARTE 3: Configurar search_path en funciones
-- ============================================================================

-- 1. calculate_service_price_with_rules
CREATE OR REPLACE FUNCTION public.calculate_service_price_with_rules(
  p_service_id uuid, 
  p_quantity integer, 
  p_event_date date DEFAULT NULL::date
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_base_price NUMERIC;
  v_final_price NUMERIC;
  v_discount_percent NUMERIC := 0;
  v_cost_price NUMERIC;
BEGIN
  -- Obtener precio base y costo
  SELECT base_price, cost_price INTO v_base_price, v_cost_price
  FROM services
  WHERE id = p_service_id;
  
  IF v_base_price IS NULL THEN
    RETURN 0;
  END IF;
  
  v_final_price := v_base_price;
  
  -- Aplicar reglas de descuento por cantidad
  SELECT COALESCE(MAX(discount_percent), 0) INTO v_discount_percent
  FROM service_price_rules
  WHERE service_id = p_service_id
    AND min_qty <= p_quantity
    AND (start_date IS NULL OR start_date <= COALESCE(p_event_date, CURRENT_DATE))
    AND (end_date IS NULL OR end_date >= COALESCE(p_event_date, CURRENT_DATE));
  
  -- Aplicar descuento
  IF v_discount_percent > 0 THEN
    v_final_price := v_final_price * (1 - v_discount_percent / 100);
  END IF;
  
  -- Validar margen mínimo (asegurar que precio >= costo * 1.1)
  IF v_cost_price > 0 AND v_final_price < v_cost_price * 1.1 THEN
    v_final_price := v_cost_price * 1.1; -- Margen mínimo del 10%
  END IF;
  
  RETURN ROUND(v_final_price, 2);
END;
$function$;

-- 2. validate_template_margin
CREATE OR REPLACE FUNCTION public.validate_template_margin(
  p_template_id uuid, 
  p_total_price numeric
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_min_margin_percent NUMERIC;
  v_services JSONB;
  v_total_cost NUMERIC := 0;
  v_margin_percent NUMERIC;
BEGIN
  -- Obtener template
  SELECT min_margin_percent, services INTO v_min_margin_percent, v_services
  FROM quote_templates
  WHERE id = p_template_id;
  
  IF v_min_margin_percent IS NULL THEN
    RETURN TRUE; -- Sin restricción de margen
  END IF;
  
  -- Calcular costo total
  FOR i IN 0..jsonb_array_length(v_services) - 1 LOOP
    DECLARE
      v_service JSONB := v_services->i;
      v_service_id UUID := (v_service->>'id')::UUID;
      v_quantity INTEGER := COALESCE((v_service->>'quantity')::INTEGER, 1);
      v_cost NUMERIC;
    BEGIN
      SELECT cost_price INTO v_cost
      FROM services
      WHERE id = v_service_id;
      
      IF v_cost IS NOT NULL THEN
        v_total_cost := v_total_cost + (v_cost * v_quantity);
      END IF;
    END;
  END LOOP;
  
  -- Calcular margen
  IF v_total_cost > 0 THEN
    v_margin_percent := ((p_total_price - v_total_cost) / p_total_price) * 100;
    RETURN v_margin_percent >= v_min_margin_percent;
  END IF;
  
  RETURN TRUE;
END;
$function$;

-- 3. save_template_version
CREATE OR REPLACE FUNCTION public.save_template_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_version INTEGER;
BEGIN
  -- Obtener siguiente versión
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version
  FROM template_versions
  WHERE template_id = NEW.id;
  
  -- Guardar versión anterior si existe
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO template_versions (
      template_id, version_number, name, description, event_type,
      services, default_notes, min_margin_percent, auto_apply_rules, changed_by
    )
    VALUES (
      OLD.id, v_version, OLD.name, OLD.description, OLD.event_type,
      OLD.services, OLD.default_notes, OLD.min_margin_percent, OLD.auto_apply_rules,
      auth.uid()
    )
    ON CONFLICT (template_id, version_number) DO NOTHING;
  END IF;
  
  -- Actualizar versión en template
  NEW.version := v_version;
  
  RETURN NEW;
END;
$function$;

-- 4. check_date_conflicts (ya tiene SECURITY DEFINER, mantenerlo pero agregar search_path)
CREATE OR REPLACE FUNCTION public.check_date_conflicts(
  p_start_date date, 
  p_end_date date, 
  p_exclude_event_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(event_id uuid, quote_id uuid, start_date date, end_date date, status text, client_name text)
LANGUAGE plpgsql
STABLE 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    e.id AS event_id,
    e.quote_id,
    e.start_date,
    e.end_date,
    e.status::TEXT,
    COALESCE(c.name, 'Sin cliente') AS client_name
  FROM events e
  LEFT JOIN quotes q ON q.id = e.quote_id
  LEFT JOIN clients c ON c.id = q.client_id
  WHERE 
    (p_exclude_event_id IS NULL OR e.id != p_exclude_event_id)
    AND e.status NOT IN ('CANCELLED', 'NO_SHOW')
    AND (
      -- Solapamiento: inicio dentro del rango
      (e.start_date <= p_end_date AND e.end_date >= p_start_date)
      OR
      -- Solapamiento: fin dentro del rango
      (e.end_date >= p_start_date AND e.start_date <= p_end_date)
      OR
      -- Solapamiento: contiene el rango completo
      (e.start_date <= p_start_date AND e.end_date >= p_end_date)
    )
  ORDER BY e.start_date;
END;
$function$;

-- 5. get_date_availability
CREATE OR REPLACE FUNCTION public.get_date_availability(
  p_start_date date, 
  p_end_date date
)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_conflicts INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_conflicts
  FROM events
  WHERE status NOT IN ('CANCELLED', 'NO_SHOW')
    AND (
      (start_date <= p_end_date AND end_date >= p_start_date)
      OR
      (end_date >= p_start_date AND start_date <= p_end_date)
      OR
      (start_date <= p_start_date AND end_date >= p_end_date)
    );
  
  IF v_conflicts = 0 THEN
    RETURN 'AVAILABLE';
  ELSIF v_conflicts = 1 THEN
    RETURN 'RESERVED';
  ELSE
    RETURN 'CONFIRMED';
  END IF;
END;
$function$;

-- 6. calculate_required_deposit
CREATE OR REPLACE FUNCTION public.calculate_required_deposit(
  p_quote_id uuid, 
  p_deposit_percent numeric DEFAULT 30.00
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_total_price NUMERIC;
  v_deposit_paid NUMERIC;
  v_required_deposit NUMERIC;
BEGIN
  -- Obtener precio total
  SELECT COALESCE(total_amount, 0) INTO v_total_price
  FROM quotes
  WHERE id = p_quote_id;
  
  -- Calcular anticipo requerido
  v_required_deposit := v_total_price * (p_deposit_percent / 100);
  
  -- Calcular anticipo ya pagado
  SELECT COALESCE(SUM(amount), 0) INTO v_deposit_paid
  FROM partial_payments
  WHERE quote_id = p_quote_id
    AND is_deposit = TRUE;
  
  RETURN GREATEST(v_required_deposit - v_deposit_paid, 0);
END;
$function$;

-- 7. get_overdue_payments (ya tiene SECURITY DEFINER, mantenerlo pero agregar search_path)
CREATE OR REPLACE FUNCTION public.get_overdue_payments(
  p_user_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(payment_id uuid, quote_id uuid, amount numeric, due_date timestamp with time zone, days_overdue integer, client_name text)
LANGUAGE plpgsql
STABLE 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    pp.id AS payment_id,
    pp.quote_id,
    pp.amount,
    pp.due_date,
    EXTRACT(DAY FROM (NOW() - pp.due_date))::INTEGER AS days_overdue,
    COALESCE(c.name, 'Sin cliente') AS client_name
  FROM partial_payments pp
  JOIN quotes q ON q.id = pp.quote_id
  LEFT JOIN clients c ON c.id = q.client_id
  WHERE 
    pp.due_date IS NOT NULL
    AND pp.due_date < NOW()
    AND pp.amount > 0
    AND (p_user_id IS NULL OR pp.created_by = p_user_id OR q.vendor_id = p_user_id)
  ORDER BY pp.due_date ASC;
END;
$function$;

-- 8. get_upcoming_payments (ya tiene SECURITY DEFINER, mantenerlo pero agregar search_path)
CREATE OR REPLACE FUNCTION public.get_upcoming_payments(
  p_days_ahead integer DEFAULT 7, 
  p_user_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(payment_id uuid, quote_id uuid, amount numeric, due_date timestamp with time zone, days_until_due integer, client_name text)
LANGUAGE plpgsql
STABLE 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    pp.id AS payment_id,
    pp.quote_id,
    pp.amount,
    pp.due_date,
    EXTRACT(DAY FROM (pp.due_date - NOW()))::INTEGER AS days_until_due,
    COALESCE(c.name, 'Sin cliente') AS client_name
  FROM partial_payments pp
  JOIN quotes q ON q.id = pp.quote_id
  LEFT JOIN clients c ON c.id = q.client_id
  WHERE 
    pp.due_date IS NOT NULL
    AND pp.due_date >= NOW()
    AND pp.due_date <= NOW() + (p_days_ahead || ' days')::INTERVAL
    AND (p_user_id IS NULL OR pp.created_by = p_user_id OR q.vendor_id = p_user_id)
  ORDER BY pp.due_date ASC;
END;
$function$;

-- 9. log_price_change (ya tiene SECURITY DEFINER, mantenerlo pero agregar search_path)
CREATE OR REPLACE FUNCTION public.log_price_change(
  p_quote_id uuid, 
  p_service_id uuid, 
  p_old_price numeric, 
  p_new_price numeric, 
  p_discount_percent numeric DEFAULT 0, 
  p_reason text DEFAULT NULL::text, 
  p_authorized_by uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_log_id UUID;
  v_discount_amount NUMERIC;
  v_authorized_by UUID;
BEGIN
  -- Calcular monto del descuento
  v_discount_amount := p_old_price - p_new_price;
  
  -- Si no se especifica autorizador, usar el usuario actual
  v_authorized_by := COALESCE(p_authorized_by, auth.uid());
  
  -- Registrar el cambio
  INSERT INTO price_change_log (
    quote_id,
    service_id,
    old_price,
    new_price,
    discount_percent,
    discount_amount,
    reason,
    authorized_by,
    changed_by
  )
  VALUES (
    p_quote_id,
    p_service_id,
    p_old_price,
    p_new_price,
    p_discount_percent,
    v_discount_amount,
    p_reason,
    v_authorized_by,
    auth.uid()
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$function$;

-- 10. detect_price_changes
CREATE OR REPLACE FUNCTION public.detect_price_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_old_price NUMERIC;
  v_new_price NUMERIC;
  v_discount_percent NUMERIC;
BEGIN
  -- Solo registrar si el precio cambió
  IF TG_OP = 'UPDATE' AND OLD.final_price IS DISTINCT FROM NEW.final_price THEN
    v_old_price := OLD.final_price;
    v_new_price := NEW.final_price;
    
    -- Calcular porcentaje de descuento
    IF v_old_price > 0 THEN
      v_discount_percent := ((v_old_price - v_new_price) / v_old_price) * 100;
    ELSE
      v_discount_percent := 0;
    END IF;
    
    -- Registrar cambio si hay descuento significativo (>1%)
    IF v_discount_percent > 1 THEN
      PERFORM log_price_change(
        NEW.quote_id,
        NEW.service_id,
        v_old_price,
        v_new_price,
        v_discount_percent,
        'Cambio automático detectado',
        NULL
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 11. calculate_late_payment_penalty
CREATE OR REPLACE FUNCTION public.calculate_late_payment_penalty(
  p_payment_id uuid, 
  p_days_overdue integer, 
  p_penalty_rate numeric DEFAULT 0.05
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_payment_amount NUMERIC;
  v_penalty_amount NUMERIC;
BEGIN
  -- Obtener monto del pago
  SELECT amount INTO v_payment_amount
  FROM partial_payments
  WHERE id = p_payment_id;
  
  IF v_payment_amount IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calcular penalización (5% por mes o fracción)
  v_penalty_amount := v_payment_amount * p_penalty_rate * CEILING(p_days_overdue / 30.0);
  
  RETURN GREATEST(v_penalty_amount, 0);
END;
$function$;

-- 12. get_events_at_risk (ya tiene SECURITY DEFINER, mantenerlo pero agregar search_path)
CREATE OR REPLACE FUNCTION public.get_events_at_risk()
RETURNS TABLE(event_id uuid, quote_id uuid, client_name text, total_amount numeric, paid_amount numeric, balance_due numeric, days_overdue integer, risk_level text)
LANGUAGE plpgsql
STABLE 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    e.id AS event_id,
    q.id AS quote_id,
    COALESCE(c.name, 'Sin cliente') AS client_name,
    q.total_amount,
    COALESCE(SUM(pp.amount) FILTER (WHERE pp.is_deposit = FALSE), 0) AS paid_amount,
    q.total_amount - COALESCE(SUM(pp.amount), 0) AS balance_due,
    MAX(EXTRACT(DAY FROM (CURRENT_DATE - pp.due_date)))::INTEGER AS days_overdue,
    CASE
      WHEN MAX(pp.due_date) < CURRENT_DATE - INTERVAL '30 days' THEN 'CRITICAL'
      WHEN MAX(pp.due_date) < CURRENT_DATE - INTERVAL '15 days' THEN 'HIGH'
      WHEN MAX(pp.due_date) < CURRENT_DATE THEN 'MEDIUM'
      ELSE 'LOW'
    END AS risk_level
  FROM events e
  JOIN quotes q ON q.id = e.quote_id
  LEFT JOIN clients c ON c.id = q.client_id
  LEFT JOIN partial_payments pp ON pp.quote_id = q.id
  WHERE e.status NOT IN ('CANCELLED', 'NO_SHOW')
    AND q.status = 'APPROVED'
    AND (
      q.total_amount > COALESCE(SUM(pp.amount), 0)
      OR EXISTS (
        SELECT 1 FROM partial_payments pp2
        WHERE pp2.quote_id = q.id
        AND pp2.due_date < CURRENT_DATE
      )
    )
  GROUP BY e.id, q.id, c.name, q.total_amount
  HAVING q.total_amount > COALESCE(SUM(pp.amount), 0)
     OR MAX(pp.due_date) < CURRENT_DATE
  ORDER BY days_overdue DESC NULLS LAST;
END;
$function$;

COMMIT;

-- ============================================================================
-- RESUMEN DE CAMBIOS
-- ============================================================================
-- ✅ 9 vistas cambiadas de SECURITY DEFINER a SECURITY INVOKER
-- ✅ 3 tablas con RLS habilitado y políticas creadas
-- ✅ 12 funciones con search_path configurado
-- ============================================================================

