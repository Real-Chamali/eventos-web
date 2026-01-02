-- ============================================================================
-- Migración 038: Actualizar RLS policies para pagos y eventos
-- ============================================================================
-- Asegura que las políticas RLS funcionen correctamente con el nuevo sistema
-- ============================================================================

-- 1. ACTUALIZAR POLÍTICAS DE PARTIAL_PAYMENTS
-- Las políticas ya están optimizadas en migración 024, pero asegurar que funcionen con is_cancelled

-- Política: Los usuarios pueden ver pagos no cancelados de sus cotizaciones
DROP POLICY IF EXISTS "Users can view payments for their quotes" ON public.partial_payments;
CREATE POLICY "Users can view payments for their quotes" ON public.partial_payments
  FOR SELECT
  TO authenticated
  USING (
    is_cancelled = FALSE
    AND EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = partial_payments.quote_id
      AND quotes.vendor_id = (select auth.uid())
    )
  );

-- Política: Los admins pueden ver todos los pagos (incluyendo cancelados)
DROP POLICY IF EXISTS "Admins can view all payments" ON public.partial_payments;
CREATE POLICY "Admins can view all payments" ON public.partial_payments
  FOR SELECT
  TO authenticated
  USING ((select public.is_admin()));

-- 2. ACTUALIZAR POLÍTICAS DE EVENTS
-- Asegurar que los usuarios puedan ver eventos relacionados con sus cotizaciones

-- Política: Los usuarios pueden ver eventos de sus cotizaciones
DROP POLICY IF EXISTS "Users can view events for their quotes" ON public.events;
CREATE POLICY "Users can view events for their quotes" ON public.events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = events.quote_id
      AND quotes.vendor_id = (select auth.uid())
    )
  );

-- Política: Los admins pueden ver todos los eventos
DROP POLICY IF EXISTS "Admins can view all events" ON public.events;
CREATE POLICY "Admins can view all events" ON public.events
  FOR SELECT
  TO authenticated
  USING ((select public.is_admin()));

-- Política: Los usuarios pueden crear eventos para sus cotizaciones
DROP POLICY IF EXISTS "Users can create events for their quotes" ON public.events;
CREATE POLICY "Users can create events for their quotes" ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = events.quote_id
      AND quotes.vendor_id = (select auth.uid())
    )
  );

-- Política: Los admins pueden crear eventos para cualquier cotización
DROP POLICY IF EXISTS "Admins can create events for any quote" ON public.events;
CREATE POLICY "Admins can create events for any quote" ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK ((select public.is_admin()));

-- Política: Los usuarios pueden actualizar eventos de sus cotizaciones
DROP POLICY IF EXISTS "Users can update events for their quotes" ON public.events;
CREATE POLICY "Users can update events for their quotes" ON public.events
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = events.quote_id
      AND quotes.vendor_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = events.quote_id
      AND quotes.vendor_id = (select auth.uid())
    )
  );

-- Política: Los admins pueden actualizar cualquier evento
DROP POLICY IF EXISTS "Admins can update any event" ON public.events;
CREATE POLICY "Admins can update any event" ON public.events
  FOR UPDATE
  TO authenticated
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

-- Política: Los usuarios pueden eliminar eventos de sus cotizaciones (soft delete)
DROP POLICY IF EXISTS "Users can delete events for their quotes" ON public.events;
CREATE POLICY "Users can delete events for their quotes" ON public.events
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = events.quote_id
      AND quotes.vendor_id = (select auth.uid())
    )
  );

-- Política: Los admins pueden eliminar cualquier evento
DROP POLICY IF EXISTS "Admins can delete any event" ON public.events;
CREATE POLICY "Admins can delete any event" ON public.events
  FOR DELETE
  TO authenticated
  USING ((select public.is_admin()));

-- 3. ACTUALIZAR POLÍTICAS DE QUOTES (si no existen)
-- Asegurar que los usuarios puedan ver sus cotizaciones y las relacionadas con eventos

-- Política: Los usuarios pueden ver sus cotizaciones
-- (Asumiendo que ya existe, solo verificar)

-- 4. PERMISOS PARA VISTA quote_financial_summary
-- Crear política para que los usuarios puedan ver el resumen financiero de sus cotizaciones

-- La vista quote_financial_summary usa las políticas de quotes subyacentes
-- No necesita políticas adicionales si las políticas de quotes están correctas

-- 5. COMENTARIOS
COMMENT ON POLICY "Users can view payments for their quotes" ON public.partial_payments IS 
'Política optimizada: usuarios pueden ver pagos no cancelados de sus cotizaciones';

COMMENT ON POLICY "Admins can view all payments" ON public.partial_payments IS 
'Política optimizada: admins pueden ver todos los pagos (incluyendo cancelados)';

COMMENT ON POLICY "Users can view events for their quotes" ON public.events IS 
'Política: usuarios pueden ver eventos de sus cotizaciones';

COMMENT ON POLICY "Admins can view all events" ON public.events IS 
'Política: admins pueden ver todos los eventos';

COMMENT ON POLICY "Users can create events for their quotes" ON public.events IS 
'Política: usuarios pueden crear eventos para sus cotizaciones';

COMMENT ON POLICY "Admins can create events for any quote" ON public.events IS 
'Política: admins pueden crear eventos para cualquier cotización';

COMMENT ON POLICY "Users can update events for their quotes" ON public.events IS 
'Política: usuarios pueden actualizar eventos de sus cotizaciones';

COMMENT ON POLICY "Admins can update any event" ON public.events IS 
'Política: admins pueden actualizar cualquier evento';

COMMENT ON POLICY "Users can delete events for their quotes" ON public.events IS 
'Política: usuarios pueden eliminar eventos de sus cotizaciones';

COMMENT ON POLICY "Admins can delete any event" ON public.events IS 
'Política: admins pueden eliminar cualquier evento';

