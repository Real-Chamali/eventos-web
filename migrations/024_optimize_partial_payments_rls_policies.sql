-- ============================================================================
-- Migración 024: Optimizar políticas RLS de partial_payments
-- ============================================================================
-- Optimiza las políticas RLS de partial_payments para mejorar performance
-- Envuelve llamadas a auth.uid() e is_admin() en (select ...) para que
-- se evalúen una sola vez por query en lugar de por cada fila
-- ============================================================================

-- 1. OPTIMIZAR POLÍTICAS DE PARTIAL_PAYMENTS

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view payments for their quotes" ON public.partial_payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.partial_payments;
DROP POLICY IF EXISTS "Users can create payments for their quotes" ON public.partial_payments;
DROP POLICY IF EXISTS "Admins can create payments for any quote" ON public.partial_payments;
DROP POLICY IF EXISTS "Users can update their own payments" ON public.partial_payments;
DROP POLICY IF EXISTS "Admins can update any payment" ON public.partial_payments;
DROP POLICY IF EXISTS "Users can delete their own payments" ON public.partial_payments;
DROP POLICY IF EXISTS "Admins can delete any payment" ON public.partial_payments;

-- Política: Los usuarios pueden ver pagos de sus propias cotizaciones (OPTIMIZADA)
CREATE POLICY "Users can view payments for their quotes" ON public.partial_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = partial_payments.quote_id
      AND quotes.vendor_id = (select auth.uid())
    )
  );

-- Política: Los admins pueden ver todos los pagos (OPTIMIZADA)
CREATE POLICY "Admins can view all payments" ON public.partial_payments
  FOR SELECT
  TO authenticated
  USING ((select public.is_admin()));

-- Política: Los usuarios pueden crear pagos para sus cotizaciones (OPTIMIZADA)
CREATE POLICY "Users can create payments for their quotes" ON public.partial_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = partial_payments.quote_id
      AND quotes.vendor_id = (select auth.uid())
    )
    AND created_by = (select auth.uid())
  );

-- Política: Los admins pueden crear pagos para cualquier cotización (OPTIMIZADA)
CREATE POLICY "Admins can create payments for any quote" ON public.partial_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (select public.is_admin())
    AND created_by = (select auth.uid())
  );

-- Política: Los usuarios pueden actualizar sus propios pagos (OPTIMIZADA)
CREATE POLICY "Users can update their own payments" ON public.partial_payments
  FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

-- Política: Los admins pueden actualizar cualquier pago (OPTIMIZADA)
CREATE POLICY "Admins can update any payment" ON public.partial_payments
  FOR UPDATE
  TO authenticated
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

-- Política: Los usuarios pueden eliminar sus propios pagos (OPTIMIZADA)
CREATE POLICY "Users can delete their own payments" ON public.partial_payments
  FOR DELETE
  TO authenticated
  USING (created_by = (select auth.uid()));

-- Política: Los admins pueden eliminar cualquier pago (OPTIMIZADA)
CREATE POLICY "Admins can delete any payment" ON public.partial_payments
  FOR DELETE
  TO authenticated
  USING ((select public.is_admin()));

-- ============================================================================
-- Comentarios
-- ============================================================================

COMMENT ON POLICY "Users can view payments for their quotes" ON public.partial_payments IS 
'Política optimizada: usuarios pueden ver pagos de sus cotizaciones';

COMMENT ON POLICY "Admins can view all payments" ON public.partial_payments IS 
'Política optimizada: admins pueden ver todos los pagos';

COMMENT ON POLICY "Users can create payments for their quotes" ON public.partial_payments IS 
'Política optimizada: usuarios pueden crear pagos para sus cotizaciones';

COMMENT ON POLICY "Admins can create payments for any quote" ON public.partial_payments IS 
'Política optimizada: admins pueden crear pagos para cualquier cotización';

COMMENT ON POLICY "Users can update their own payments" ON public.partial_payments IS 
'Política optimizada: usuarios pueden actualizar sus propios pagos';

COMMENT ON POLICY "Admins can update any payment" ON public.partial_payments IS 
'Política optimizada: admins pueden actualizar cualquier pago';

COMMENT ON POLICY "Users can delete their own payments" ON public.partial_payments IS 
'Política optimizada: usuarios pueden eliminar sus propios pagos';

COMMENT ON POLICY "Admins can delete any payment" ON public.partial_payments IS 
'Política optimizada: admins pueden eliminar cualquier pago';

