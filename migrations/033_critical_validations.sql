-- ============================================================================
-- Migración 033: Validaciones Críticas del Sistema
-- ============================================================================
-- Esta migración agrega validaciones críticas identificadas en la auditoría:
-- 1. Validación de suma de pagos no puede exceder total de cotización
-- 2. Validación de fechas pasadas en eventos
-- 3. Mejoras en integridad de datos
-- ============================================================================

-- ============================================================================
-- 1. FUNCIÓN: Validar que la suma de pagos no exceda el total de la cotización
-- ============================================================================
-- CRÍTICO: Previene estados financieros incorrectos
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_payment_total()
RETURNS TRIGGER AS $$
DECLARE
  v_total_price DECIMAL(10,2);
  v_total_paid DECIMAL(10,2);
  v_new_total DECIMAL(10,2);
BEGIN
  -- Obtener el total de la cotización
  SELECT COALESCE(total_amount, 0) INTO v_total_price
  FROM quotes
  WHERE id = NEW.quote_id;
  
  -- Si no existe la cotización, permitir (la FK constraint lo manejará)
  IF v_total_price IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calcular total pagado (excluyendo el registro actual si es UPDATE)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM partial_payments
  WHERE quote_id = NEW.quote_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  -- Calcular nuevo total con el pago actual
  v_new_total := v_total_paid + NEW.amount;
  
  -- Validar que no exceda el total de la cotización
  -- Permitir un pequeño margen de error (0.01) por redondeo
  IF v_new_total > (v_total_price + 0.01) THEN
    RAISE EXCEPTION 'La suma de pagos (%.2f) no puede exceder el total de la cotización (%.2f). Balance pendiente: %.2f',
      v_new_total, v_total_price, GREATEST(v_total_price - v_total_paid, 0);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para validar antes de insertar o actualizar
DROP TRIGGER IF EXISTS validate_payment_total_trigger ON partial_payments;
CREATE TRIGGER validate_payment_total_trigger
BEFORE INSERT OR UPDATE ON partial_payments
FOR EACH ROW
EXECUTE FUNCTION validate_payment_total();

-- Comentarios
COMMENT ON FUNCTION validate_payment_total() IS 
'Valida que la suma de pagos no exceda el total de la cotización. CRÍTICO para integridad financiera.';

-- ============================================================================
-- 2. MEJORAR: Validación de fechas pasadas en eventos
-- ============================================================================
-- Previene crear eventos en fechas pasadas (puede causar confusión)
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_past_events()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar que start_date no sea null (ya existe en prevent_overlapping_events)
  IF NEW.start_date IS NULL THEN
    RAISE EXCEPTION 'start_date no puede ser null';
  END IF;
  
  -- Validar que no se creen eventos en fechas pasadas
  -- Permitir eventos del día actual (comparar solo la fecha, no la hora)
  IF DATE(NEW.start_date) < CURRENT_DATE THEN
    RAISE EXCEPTION 'No se pueden crear eventos en fechas pasadas. Fecha mínima permitida: %', CURRENT_DATE;
  END IF;
  
  -- Si hay end_date, validar que no sea anterior a start_date
  IF NEW.end_date IS NOT NULL AND NEW.end_date < NEW.start_date THEN
    RAISE EXCEPTION 'end_date no puede ser anterior a start_date';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Agregar validación de fechas pasadas al trigger existente
-- Modificar la función prevent_overlapping_events para incluir esta validación
CREATE OR REPLACE FUNCTION prevent_overlapping_events()
RETURNS TRIGGER AS $$
DECLARE
  event_start TIMESTAMPTZ;
  event_end TIMESTAMPTZ;
BEGIN
  -- Validar que start_date no sea null
  IF NEW.start_date IS NULL THEN
    RAISE EXCEPTION 'start_date no puede ser null';
  END IF;
  
  -- Validar que no se creen eventos en fechas pasadas
  IF DATE(NEW.start_date) < CURRENT_DATE THEN
    RAISE EXCEPTION 'No se pueden crear eventos en fechas pasadas. Fecha mínima permitida: %', CURRENT_DATE;
  END IF;
  
  -- Si hay end_date, validar que no sea anterior a start_date
  IF NEW.end_date IS NOT NULL AND NEW.end_date < NEW.start_date THEN
    RAISE EXCEPTION 'end_date no puede ser anterior a start_date';
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
$$ LANGUAGE plpgsql;

-- El trigger ya existe, solo actualizamos la función
-- DROP TRIGGER IF EXISTS check_overlapping_events ON events;
-- CREATE TRIGGER check_overlapping_events
-- BEFORE INSERT OR UPDATE ON events
-- FOR EACH ROW
-- EXECUTE FUNCTION prevent_overlapping_events();

-- Comentarios
COMMENT ON FUNCTION prevent_overlapping_events() IS 
'Previene la creación de eventos duplicados, con fechas solapadas, en fechas pasadas o con end_date anterior a start_date.';

-- ============================================================================
-- 3. FUNCIÓN: Validar transiciones de estado de cotizaciones
-- ============================================================================
-- Previene cambios de estado inválidos (ej: cancelled → confirmed)
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_quote_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  valid_transitions TEXT[];
BEGIN
  -- Si el estado no cambió, permitir
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Definir transiciones válidas
  -- draft puede ir a: pending, cancelled
  -- pending puede ir a: confirmed, cancelled
  -- confirmed puede ir a: cancelled (solo admin puede hacer esto)
  -- cancelled es terminal (no puede cambiar)
  
  -- Mapear estados del enum a lógica de negocio
  -- Enum: DRAFT, APPROVED, REJECTED
  -- Lógica: DRAFT -> APPROVED (confirmar), DRAFT -> REJECTED (cancelar)
  --         APPROVED -> REJECTED (solo admin puede cancelar confirmada)
  --         REJECTED es terminal
  
  CASE OLD.status::text
    WHEN 'DRAFT' THEN
      valid_transitions := ARRAY['APPROVED', 'REJECTED'];
    WHEN 'APPROVED' THEN
      -- Solo admin puede rechazar una cotización aprobada
      IF NEW.status::text = 'REJECTED' AND NOT (SELECT public.is_admin()) THEN
        RAISE EXCEPTION 'Solo los administradores pueden rechazar cotizaciones aprobadas';
      END IF;
      valid_transitions := ARRAY['REJECTED'];
    WHEN 'REJECTED' THEN
      -- REJECTED es terminal, no puede cambiar
      RAISE EXCEPTION 'No se puede cambiar el estado de una cotización rechazada. Estado actual: REJECTED';
    ELSE
      -- Estado desconocido, permitir (por compatibilidad)
      RETURN NEW;
  END CASE;
  
  -- Validar que la transición sea válida
  IF NOT (NEW.status::text = ANY(valid_transitions)) THEN
    RAISE EXCEPTION 'Transición de estado inválida: de % a %. Transiciones válidas desde %: %',
      OLD.status::text, NEW.status::text, OLD.status::text, array_to_string(valid_transitions, ', ');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para validar transiciones de estado
DROP TRIGGER IF EXISTS validate_quote_status_transition_trigger ON quotes;
CREATE TRIGGER validate_quote_status_transition_trigger
BEFORE UPDATE ON quotes
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION validate_quote_status_transition();

-- Comentarios
COMMENT ON FUNCTION validate_quote_status_transition() IS 
'Valida que las transiciones de estado de cotizaciones sean válidas. Previene estados inconsistentes.';

-- ============================================================================
-- 4. ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================================================
-- Mejoran consultas frecuentes del dashboard y reportes
-- ============================================================================

-- Índice para filtrar cotizaciones por status y fecha
-- Nota: Usar valores del enum quote_status (DRAFT, APPROVED, REJECTED)
CREATE INDEX IF NOT EXISTS idx_quotes_status_created_at 
ON quotes(status, created_at DESC)
WHERE status IN ('APPROVED', 'REJECTED');

-- Índice para consultas de cotizaciones por vendedor y fecha
CREATE INDEX IF NOT EXISTS idx_quotes_vendor_created_at 
ON quotes(vendor_id, created_at DESC);

-- Índice para consultas de cotizaciones por cliente
CREATE INDEX IF NOT EXISTS idx_quotes_client_created_at 
ON quotes(client_id, created_at DESC);

-- Índice compuesto para eventos por fecha (mejora calendario)
CREATE INDEX IF NOT EXISTS idx_events_start_date_status 
ON events(start_date, status)
WHERE start_date IS NOT NULL;

-- Comentarios
COMMENT ON INDEX idx_quotes_status_created_at IS 
'Índice para consultas frecuentes de cotizaciones por estado y fecha (dashboard)';
COMMENT ON INDEX idx_quotes_vendor_created_at IS 
'Índice para consultas de cotizaciones por vendedor (reportes de rendimiento)';
COMMENT ON INDEX idx_events_start_date_status IS 
'Índice para consultas de eventos por fecha (calendario)';

-- ============================================================================
-- 5. VALIDACIONES ADICIONALES DE INTEGRIDAD
-- ============================================================================

-- Validar que total_amount de quotes sea positivo
ALTER TABLE quotes 
DROP CONSTRAINT IF EXISTS quotes_total_amount_positive;

ALTER TABLE quotes 
ADD CONSTRAINT quotes_total_amount_positive 
CHECK (total_amount >= 0);

-- Validar que quantity en quote_services sea positiva
ALTER TABLE quote_services 
DROP CONSTRAINT IF EXISTS quote_services_quantity_positive;

ALTER TABLE quote_services 
ADD CONSTRAINT quote_services_quantity_positive 
CHECK (quantity > 0);

-- Validar que final_price en quote_services sea positivo
ALTER TABLE quote_services 
DROP CONSTRAINT IF EXISTS quote_services_final_price_positive;

ALTER TABLE quote_services 
ADD CONSTRAINT quote_services_final_price_positive 
CHECK (final_price >= 0);

-- Comentarios
COMMENT ON CONSTRAINT quotes_total_amount_positive ON quotes IS 
'Garantiza que el total de la cotización no sea negativo';
COMMENT ON CONSTRAINT quote_services_quantity_positive ON quote_services IS 
'Garantiza que la cantidad de servicios sea mayor a 0';
COMMENT ON CONSTRAINT quote_services_final_price_positive ON quote_services IS 
'Garantiza que el precio final de servicios no sea negativo';

-- ============================================================================
-- RESUMEN DE CAMBIOS
-- ============================================================================
-- ✅ Trigger validate_payment_total: Previene pagos que excedan el total
-- ✅ Función prevent_overlapping_events mejorada: Valida fechas pasadas
-- ✅ Trigger validate_quote_status_transition: Valida transiciones de estado
-- ✅ Índices adicionales: Mejoran performance de consultas frecuentes
-- ✅ Constraints adicionales: Validaciones de integridad
-- ============================================================================

