-- ============================================================================
-- Migración 013: Crear tabla de pagos parciales
-- ============================================================================
-- Sistema premium de pagos parciales para cotizaciones
-- Permite registrar múltiples pagos para una misma cotización
-- ============================================================================

-- Crear tabla de pagos parciales
CREATE TABLE IF NOT EXISTS partial_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  payment_method VARCHAR(50) NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'transfer', 'card', 'check', 'other')),
  reference_number VARCHAR(255),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Crear Índices para Performance
-- ============================================================================

-- Índice por quote_id para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_partial_payments_quote_id ON partial_payments(quote_id);

-- Índice por payment_date para ordenamiento temporal
CREATE INDEX IF NOT EXISTS idx_partial_payments_payment_date ON partial_payments(payment_date DESC);

-- Índice por created_by para filtrar por usuario
CREATE INDEX IF NOT EXISTS idx_partial_payments_created_by ON partial_payments(created_by);

-- Índice compuesto para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_partial_payments_quote_date ON partial_payments(quote_id, payment_date DESC);

-- ============================================================================
-- Función para calcular total pagado de una cotización
-- ============================================================================

CREATE OR REPLACE FUNCTION get_total_paid(quote_uuid UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
STABLE
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

-- ============================================================================
-- Función para obtener balance pendiente de una cotización
-- ============================================================================

CREATE OR REPLACE FUNCTION get_balance_due(quote_uuid UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  total_price DECIMAL(10,2);
  total_paid DECIMAL(10,2);
BEGIN
  SELECT COALESCE(total_price, 0) INTO total_price
  FROM quotes
  WHERE id = quote_uuid;
  
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM partial_payments
  WHERE quote_id = quote_uuid;
  
  RETURN GREATEST(total_price - total_paid, 0);
END;
$$;

-- ============================================================================
-- Trigger para actualizar updated_at automáticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION update_partial_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_partial_payments_updated_at
BEFORE UPDATE ON partial_payments
FOR EACH ROW
EXECUTE FUNCTION update_partial_payments_updated_at();

-- ============================================================================
-- Habilitar Row Level Security (RLS)
-- ============================================================================

ALTER TABLE partial_payments ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver pagos de sus propias cotizaciones
CREATE POLICY "Users can view payments for their quotes"
ON partial_payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.id = partial_payments.quote_id
    AND quotes.vendor_id = auth.uid()
  )
);

-- Política: Los admins pueden ver todos los pagos
CREATE POLICY "Admins can view all payments"
ON partial_payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Política: Los usuarios pueden crear pagos para sus cotizaciones
CREATE POLICY "Users can create payments for their quotes"
ON partial_payments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.id = partial_payments.quote_id
    AND quotes.vendor_id = auth.uid()
  )
  AND created_by = auth.uid()
);

-- Política: Los admins pueden crear pagos para cualquier cotización
CREATE POLICY "Admins can create payments for any quote"
ON partial_payments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
  AND created_by = auth.uid()
);

-- Política: Los usuarios pueden actualizar sus propios pagos
CREATE POLICY "Users can update their own payments"
ON partial_payments FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Política: Los admins pueden actualizar cualquier pago
CREATE POLICY "Admins can update any payment"
ON partial_payments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Política: Los usuarios pueden eliminar sus propios pagos
CREATE POLICY "Users can delete their own payments"
ON partial_payments FOR DELETE
USING (created_by = auth.uid());

-- Política: Los admins pueden eliminar cualquier pago
CREATE POLICY "Admins can delete any payment"
ON partial_payments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- Comentarios para documentación
-- ============================================================================

COMMENT ON TABLE partial_payments IS 'Sistema premium de pagos parciales para cotizaciones';
COMMENT ON COLUMN partial_payments.quote_id IS 'ID de la cotización asociada';
COMMENT ON COLUMN partial_payments.amount IS 'Monto del pago (debe ser mayor a 0)';
COMMENT ON COLUMN partial_payments.payment_date IS 'Fecha del pago';
COMMENT ON COLUMN partial_payments.payment_method IS 'Método de pago: cash, transfer, card, check, other';
COMMENT ON COLUMN partial_payments.reference_number IS 'Número de referencia del pago (transferencia, cheque, etc.)';
COMMENT ON COLUMN partial_payments.notes IS 'Notas adicionales sobre el pago';
COMMENT ON FUNCTION get_total_paid IS 'Calcula el total pagado de una cotización';
COMMENT ON FUNCTION get_balance_due IS 'Calcula el balance pendiente de una cotización';

