-- ============================================================================
-- Migración 037: Mejorar sistema de pagos parciales
-- ============================================================================
-- Agrega validaciones estrictas, estados automáticos y funciones mejoradas
-- ============================================================================

-- 1. Agregar columna de estado cancelado a partial_payments (soft delete)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partial_payments' AND column_name = 'is_cancelled'
  ) THEN
    ALTER TABLE partial_payments 
    ADD COLUMN is_cancelled BOOLEAN DEFAULT FALSE;
    
    COMMENT ON COLUMN partial_payments.is_cancelled IS 
    'Indica si el pago fue cancelado (soft delete)';
  END IF;
END $$;

-- 2. Agregar columna de motivo de cancelación
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partial_payments' AND column_name = 'cancellation_reason'
  ) THEN
    ALTER TABLE partial_payments 
    ADD COLUMN cancellation_reason TEXT;
    
    COMMENT ON COLUMN partial_payments.cancellation_reason IS 
    'Motivo de cancelación del pago';
  END IF;
END $$;

-- 3. Función mejorada para validar pagos antes de insertar
CREATE OR REPLACE FUNCTION validate_payment_amount()
RETURNS TRIGGER AS $$
DECLARE
  v_total_amount DECIMAL(10,2);
  v_total_paid DECIMAL(10,2);
  v_balance_due DECIMAL(10,2);
BEGIN
  -- Obtener total de la cotización
  SELECT COALESCE(total_amount, 0) INTO v_total_amount
  FROM quotes
  WHERE id = NEW.quote_id;
  
  IF v_total_amount IS NULL THEN
    RAISE EXCEPTION 'Cotización no encontrada: %', NEW.quote_id;
  END IF;
  
  -- Calcular total pagado (excluyendo pagos cancelados y el pago actual si es update)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM partial_payments
  WHERE quote_id = NEW.quote_id
  AND is_cancelled = FALSE
  AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  -- Calcular balance pendiente
  v_balance_due := GREATEST(v_total_amount - v_total_paid, 0);
  
  -- Validar que el monto no exceda el balance pendiente
  IF NEW.amount > v_balance_due THEN
    RAISE EXCEPTION 'El monto del pago (%.2f) excede el balance pendiente (%.2f). Total cotizado: %.2f, Total pagado: %.2f', 
      NEW.amount, v_balance_due, v_total_amount, v_total_paid;
  END IF;
  
  -- Validar que el monto sea positivo
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'El monto del pago debe ser mayor a 0';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- 4. Crear trigger para validar pagos
DROP TRIGGER IF EXISTS check_payment_amount ON partial_payments;
CREATE TRIGGER check_payment_amount
BEFORE INSERT OR UPDATE ON partial_payments
FOR EACH ROW
WHEN (NEW.is_cancelled = FALSE)
EXECUTE FUNCTION validate_payment_amount();

-- 5. Función para calcular estado financiero de cotización
CREATE OR REPLACE FUNCTION get_quote_financial_status(quote_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total_amount DECIMAL(10,2);
  v_total_paid DECIMAL(10,2);
  v_balance_due DECIMAL(10,2);
BEGIN
  -- Obtener total de la cotización
  SELECT COALESCE(total_amount, 0) INTO v_total_amount
  FROM quotes
  WHERE id = quote_uuid;
  
  IF v_total_amount IS NULL THEN
    RETURN 'UNKNOWN';
  END IF;
  
  -- Calcular total pagado (solo pagos no cancelados)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM partial_payments
  WHERE quote_id = quote_uuid
  AND is_cancelled = FALSE;
  
  -- Calcular balance pendiente
  v_balance_due := GREATEST(v_total_amount - v_total_paid, 0);
  
  -- Determinar estado
  IF v_total_paid = 0 THEN
    RETURN 'PENDING'; -- Sin pagos
  ELSIF v_balance_due > 0 THEN
    RETURN 'PARTIAL'; -- Con abonos pero no liquidado
  ELSE
    RETURN 'PAID'; -- Liquidado completamente
  END IF;
END;
$$;

-- 6. Función para actualizar estado de cotización basado en pagos
CREATE OR REPLACE FUNCTION update_quote_status_from_payments()
RETURNS TRIGGER AS $$
DECLARE
  v_financial_status TEXT;
  v_quote_status quote_status;
BEGIN
  -- Obtener estado financiero actual
  v_financial_status := get_quote_financial_status(
    COALESCE(NEW.quote_id, OLD.quote_id)
  );
  
  -- Mapear estado financiero a estado de cotización
  -- No cambiar el estado si la cotización está cancelada
  SELECT status INTO v_quote_status
  FROM quotes
  WHERE id = COALESCE(NEW.quote_id, OLD.quote_id);
  
  IF v_quote_status = 'REJECTED' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Actualizar estado de cotización según pagos
  -- PENDING -> DRAFT (sin pagos)
  -- PARTIAL -> APPROVED (con abonos)
  -- PAID -> APPROVED (liquidado)
  IF v_financial_status = 'PENDING' THEN
    -- Si no hay pagos, mantener estado actual o cambiar a DRAFT si es necesario
    -- No forzar cambio automático aquí
    NULL;
  ELSIF v_financial_status = 'PARTIAL' OR v_financial_status = 'PAID' THEN
    -- Si hay pagos, asegurar que esté en APPROVED
    UPDATE quotes
    SET status = 'APPROVED'
    WHERE id = COALESCE(NEW.quote_id, OLD.quote_id)
    AND status != 'REJECTED';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- 7. Crear trigger para actualizar estado de cotización
DROP TRIGGER IF EXISTS trigger_update_quote_status_from_payments ON partial_payments;
CREATE TRIGGER trigger_update_quote_status_from_payments
AFTER INSERT OR UPDATE OR DELETE ON partial_payments
FOR EACH ROW
EXECUTE FUNCTION update_quote_status_from_payments();

-- 8. Función para registrar pago con validación y transacción
CREATE OR REPLACE FUNCTION register_payment(
  p_quote_id UUID,
  p_amount DECIMAL(10,2),
  p_created_by UUID,
  p_payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  p_payment_method VARCHAR(50) DEFAULT 'cash',
  p_reference_number VARCHAR(255) DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_payment_id UUID;
  v_total_amount DECIMAL(10,2);
  v_total_paid DECIMAL(10,2);
  v_balance_due DECIMAL(10,2);
BEGIN
  -- Validar que la cotización existe
  SELECT COALESCE(total_amount, 0) INTO v_total_amount
  FROM quotes
  WHERE id = p_quote_id;
  
  IF v_total_amount IS NULL THEN
    RAISE EXCEPTION 'Cotización no encontrada: %', p_quote_id;
  END IF;
  
  -- Calcular total pagado (excluyendo cancelados)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM partial_payments
  WHERE quote_id = p_quote_id
  AND is_cancelled = FALSE;
  
  -- Calcular balance pendiente
  v_balance_due := GREATEST(v_total_amount - v_total_paid, 0);
  
  -- Validar monto
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'El monto del pago debe ser mayor a 0';
  END IF;
  
  IF p_amount > v_balance_due THEN
    RAISE EXCEPTION 'El monto del pago (%.2f) excede el balance pendiente (%.2f)', 
      p_amount, v_balance_due;
  END IF;
  
  -- Validar método de pago
  IF p_payment_method NOT IN ('cash', 'transfer', 'card', 'check', 'other') THEN
    RAISE EXCEPTION 'Método de pago inválido: %', p_payment_method;
  END IF;
  
  -- Insertar pago
  INSERT INTO partial_payments (
    quote_id,
    amount,
    payment_date,
    payment_method,
    reference_number,
    notes,
    created_by,
    is_cancelled
  ) VALUES (
    p_quote_id,
    p_amount,
    p_payment_date,
    p_payment_method,
    p_reference_number,
    p_notes,
    p_created_by,
    FALSE
  )
  RETURNING id INTO v_payment_id;
  
  -- El trigger actualizará automáticamente el estado de la cotización
  
  RETURN v_payment_id;
END;
$$;

-- 9. Función para cancelar pago (soft delete)
CREATE OR REPLACE FUNCTION cancel_payment(
  p_payment_id UUID,
  p_cancelled_by UUID,
  p_cancellation_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Validar que el pago existe y no está cancelado
  IF NOT EXISTS (
    SELECT 1 FROM partial_payments
    WHERE id = p_payment_id
    AND is_cancelled = FALSE
  ) THEN
    RAISE EXCEPTION 'Pago no encontrado o ya cancelado: %', p_payment_id;
  END IF;
  
  -- Marcar como cancelado
  UPDATE partial_payments
  SET 
    is_cancelled = TRUE,
    cancellation_reason = p_cancellation_reason,
    updated_at = NOW()
  WHERE id = p_payment_id;
  
  -- El trigger actualizará automáticamente el estado de la cotización
  
  RETURN TRUE;
END;
$$;

-- 10. Vista para obtener resumen financiero de cotizaciones
CREATE OR REPLACE VIEW quote_financial_summary AS
SELECT 
  q.id AS quote_id,
  q.client_id,
  q.vendor_id,
  q.status AS quote_status,
  q.total_amount,
  COALESCE(SUM(pp.amount) FILTER (WHERE pp.is_cancelled = FALSE), 0) AS total_paid,
  GREATEST(q.total_amount - COALESCE(SUM(pp.amount) FILTER (WHERE pp.is_cancelled = FALSE), 0), 0) AS remaining_balance,
  get_quote_financial_status(q.id) AS financial_status,
  COUNT(pp.id) FILTER (WHERE pp.is_cancelled = FALSE) AS payment_count,
  MAX(pp.payment_date) FILTER (WHERE pp.is_cancelled = FALSE) AS last_payment_date
FROM quotes q
LEFT JOIN partial_payments pp ON pp.quote_id = q.id
GROUP BY q.id, q.client_id, q.vendor_id, q.status, q.total_amount;

-- 11. Comentarios
COMMENT ON FUNCTION validate_payment_amount() IS 
'Valida que el monto del pago no exceda el balance pendiente de la cotización';

COMMENT ON FUNCTION get_quote_financial_status IS 
'Calcula el estado financiero de una cotización: PENDING, PARTIAL, PAID';

COMMENT ON FUNCTION register_payment IS 
'Registra un pago parcial con validaciones estrictas. Retorna el ID del pago creado.';

COMMENT ON FUNCTION cancel_payment IS 
'Cancela un pago (soft delete). Actualiza automáticamente el estado de la cotización.';

COMMENT ON VIEW quote_financial_summary IS 
'Vista con resumen financiero de todas las cotizaciones: total, pagado, pendiente, estado';

