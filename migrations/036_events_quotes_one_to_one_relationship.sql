-- ============================================================================
-- Migración 036: Relación 1:1 entre eventos y cotizaciones
-- ============================================================================
-- Asegura que cada evento tenga exactamente una cotización asociada
-- y que cada cotización pueda tener máximo un evento activo
-- ============================================================================

-- 1. Agregar constraint UNIQUE en quote_id de events (1 evento por cotización)
DO $$
BEGIN
  -- Verificar si ya existe el constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'events_quote_id_unique'
  ) THEN
    -- Crear índice único para prevenir múltiples eventos por cotización
    CREATE UNIQUE INDEX IF NOT EXISTS idx_events_quote_id_unique 
    ON events(quote_id) 
    WHERE quote_id IS NOT NULL;
    
    -- Agregar comentario
    COMMENT ON INDEX idx_events_quote_id_unique IS 
    'Garantiza relación 1:1 entre eventos y cotizaciones - un evento por cotización';
  END IF;
END $$;

-- 2. Función para validar relación 1:1 antes de insertar/actualizar evento
CREATE OR REPLACE FUNCTION validate_event_quote_one_to_one()
RETURNS TRIGGER AS $$
BEGIN
  -- Si quote_id es NULL, permitir (evento sin cotización temporal)
  IF NEW.quote_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Verificar que no exista otro evento activo con la misma cotización
  IF EXISTS (
    SELECT 1 FROM events
    WHERE quote_id = NEW.quote_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND status NOT IN ('CANCELLED', 'NO_SHOW') -- Eventos cancelados no cuentan
  ) THEN
    RAISE EXCEPTION 'Ya existe un evento activo para esta cotización. Relación 1:1 estricta.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- 3. Crear trigger para validar relación 1:1
DROP TRIGGER IF EXISTS check_event_quote_one_to_one ON events;
CREATE TRIGGER check_event_quote_one_to_one
BEFORE INSERT OR UPDATE ON events
FOR EACH ROW
WHEN (NEW.quote_id IS NOT NULL)
EXECUTE FUNCTION validate_event_quote_one_to_one();

-- 4. Función para crear evento y cotización en una transacción
CREATE OR REPLACE FUNCTION create_event_with_quote(
  p_client_id UUID,
  p_vendor_id UUID,
  p_start_date DATE,
  p_total_amount DECIMAL(10,2),
  p_end_date DATE DEFAULT NULL,
  p_start_time TIME DEFAULT NULL,
  p_end_time TIME DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_event_status TEXT DEFAULT 'LOGISTICS',
  p_quote_status TEXT DEFAULT 'DRAFT',
  p_location TEXT DEFAULT NULL,
  p_guest_count INTEGER DEFAULT NULL,
  p_event_type TEXT DEFAULT NULL,
  p_emergency_contact TEXT DEFAULT NULL,
  p_emergency_phone TEXT DEFAULT NULL,
  p_special_requirements TEXT DEFAULT NULL,
  p_additional_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
  event_id UUID,
  quote_id UUID
)
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_quote_id UUID;
  v_event_id UUID;
BEGIN
  -- Validar que el cliente existe
  IF NOT EXISTS (SELECT 1 FROM clients WHERE id = p_client_id) THEN
    RAISE EXCEPTION 'Cliente no encontrado: %', p_client_id;
  END IF;
  
  -- Validar que el vendedor existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_vendor_id) THEN
    RAISE EXCEPTION 'Vendedor no encontrado: %', p_vendor_id;
  END IF;
  
  -- Validar que el monto es positivo
  IF p_total_amount <= 0 THEN
    RAISE EXCEPTION 'El monto total debe ser mayor a 0';
  END IF;
  
  -- Validar fecha de inicio
  IF p_start_date IS NULL THEN
    RAISE EXCEPTION 'La fecha de inicio es requerida';
  END IF;
  
  -- Validar que end_date no sea anterior a start_date
  IF p_end_date IS NOT NULL AND p_end_date < p_start_date THEN
    RAISE EXCEPTION 'La fecha de fin no puede ser anterior a la fecha de inicio';
  END IF;
  
  -- Crear cotización primero
  INSERT INTO quotes (
    client_id,
    vendor_id,
    status,
    total_amount,
    event_date,
    notes
  ) VALUES (
    p_client_id,
    p_vendor_id,
    p_quote_status::quote_status,
    p_total_amount,
    p_start_date,
    p_notes
  )
  RETURNING id INTO v_quote_id;
  
  -- Crear evento asociado
  INSERT INTO events (
    quote_id,
    start_date,
    end_date,
    start_time,
    end_time,
    status,
    location,
    guest_count,
    event_type,
    emergency_contact,
    emergency_phone,
    special_requirements,
    additional_notes
  ) VALUES (
    v_quote_id,
    p_start_date,
    p_end_date,
    p_start_time,
    p_end_time,
    p_event_status::event_status,
    p_location,
    p_guest_count,
    p_event_type,
    p_emergency_contact,
    p_emergency_phone,
    p_special_requirements,
    p_additional_notes
  )
  RETURNING id INTO v_event_id;
  
  -- Retornar ambos IDs
  RETURN QUERY SELECT v_event_id, v_quote_id;
END;
$$;

-- 5. Función para cancelar evento y cotización (soft delete)
CREATE OR REPLACE FUNCTION cancel_event_and_quote(
  p_event_id UUID,
  p_cancellation_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_quote_id UUID;
BEGIN
  -- Obtener quote_id del evento
  SELECT quote_id INTO v_quote_id
  FROM events
  WHERE id = p_event_id;
  
  IF v_quote_id IS NULL THEN
    RAISE EXCEPTION 'Evento no encontrado: %', p_event_id;
  END IF;
  
  -- Marcar evento como cancelado
  UPDATE events
  SET status = 'CANCELLED'
  WHERE id = p_event_id;
  
  -- Marcar cotización como rechazada (cancelled)
  UPDATE quotes
  SET status = 'REJECTED'
  WHERE id = v_quote_id;
  
  -- Agregar nota de cancelación si se proporciona
  IF p_cancellation_reason IS NOT NULL THEN
    UPDATE quotes
    SET notes = COALESCE(notes || E'\n\n', '') || 'CANCELACIÓN: ' || p_cancellation_reason
    WHERE id = v_quote_id;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 6. Comentarios
COMMENT ON FUNCTION validate_event_quote_one_to_one() IS 
'Valida que la relación entre eventos y cotizaciones sea 1:1 estricta';

COMMENT ON FUNCTION create_event_with_quote IS 
'Crea un evento y su cotización asociada en una transacción atómica. Retorna ambos IDs.';

COMMENT ON FUNCTION cancel_event_and_quote IS 
'Cancela un evento y su cotización asociada (soft delete). Marca ambos como cancelados.';

COMMENT ON INDEX idx_events_quote_id_unique IS 
'Garantiza relación 1:1 entre eventos y cotizaciones - un evento por cotización';

