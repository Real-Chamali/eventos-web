-- ============================================================================
-- Migración 034: Asegurar Validaciones Críticas Aplicadas
-- ============================================================================
-- Esta migración verifica y asegura que todas las validaciones críticas
-- identificadas en la auditoría estén aplicadas correctamente.
-- Es idempotente - puede ejecutarse múltiples veces sin problemas.
-- ============================================================================

-- ============================================================================
-- 1. VERIFICAR Y CREAR TRIGGER DE VALIDACIÓN DE PAGOS
-- ============================================================================

-- Asegurar que la función existe
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

-- Asegurar que el trigger existe
DROP TRIGGER IF EXISTS validate_payment_total_trigger ON partial_payments;
CREATE TRIGGER validate_payment_total_trigger
BEFORE INSERT OR UPDATE ON partial_payments
FOR EACH ROW
EXECUTE FUNCTION validate_payment_total();

-- Comentarios
COMMENT ON FUNCTION validate_payment_total() IS 
'Valida que la suma de pagos no exceda el total de la cotización. CRÍTICO para integridad financiera.';

-- ============================================================================
-- 2. VERIFICAR CONSTRAINTS DE INTEGRIDAD
-- ============================================================================

-- Asegurar que total_amount de quotes sea positivo o cero
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'quotes_total_amount_positive'
  ) THEN
    ALTER TABLE quotes 
    ADD CONSTRAINT quotes_total_amount_positive 
    CHECK (total_amount >= 0);
  END IF;
END $$;

-- Asegurar que quantity en quote_services sea positiva
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'quote_services_quantity_positive'
  ) THEN
    ALTER TABLE quote_services 
    ADD CONSTRAINT quote_services_quantity_positive 
    CHECK (quantity > 0);
  END IF;
END $$;

-- Asegurar que final_price en quote_services sea positivo o cero
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'quote_services_final_price_positive'
  ) THEN
    ALTER TABLE quote_services 
    ADD CONSTRAINT quote_services_final_price_positive 
    CHECK (final_price >= 0);
  END IF;
END $$;

-- ============================================================================
-- 3. VERIFICAR ÍNDICES CRÍTICOS DE PERFORMANCE
-- ============================================================================

-- Índice para filtrar cotizaciones por status y fecha
CREATE INDEX IF NOT EXISTS idx_quotes_status_created_at 
ON quotes(status, created_at DESC)
WHERE status IN ('APPROVED', 'REJECTED');

-- Índice para consultas de cotizaciones por vendedor y fecha
CREATE INDEX IF NOT EXISTS idx_quotes_vendor_created_at 
ON quotes(vendor_id, created_at DESC);

-- Índice para consultas de cotizaciones por cliente
CREATE INDEX IF NOT EXISTS idx_quotes_client_created_at 
ON quotes(client_id, created_at DESC)
WHERE client_id IS NOT NULL;

-- Índice compuesto para eventos por fecha (mejora calendario)
CREATE INDEX IF NOT EXISTS idx_events_start_date_status 
ON events(start_date, status)
WHERE start_date IS NOT NULL;

-- ============================================================================
-- RESUMEN
-- ============================================================================
-- ✅ Trigger validate_payment_total: Asegurado
-- ✅ Constraints de integridad: Verificados y creados si no existen
-- ✅ Índices de performance: Verificados y creados si no existen
-- ============================================================================

