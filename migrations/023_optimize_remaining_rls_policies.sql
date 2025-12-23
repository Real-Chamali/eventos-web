-- ============================================================================
-- Migración 023: Optimizar Políticas RLS Restantes
-- ============================================================================
-- Problema: Algunas políticas RLS re-evalúan auth.uid() e is_admin()
--           para cada fila, causando problemas de rendimiento.
-- Solución: Envolver todas las llamadas en (select ...) para que se evalúen
--           una sola vez por consulta.
-- ============================================================================
-- Basado en advisories de Supabase que detectan políticas no optimizadas
-- ============================================================================

-- ============================================================================
-- 1. OPTIMIZAR POLÍTICAS DE PROFILES
-- ============================================================================

-- Eliminar TODAS las políticas de profiles (incluyendo duplicadas)
DROP POLICY IF EXISTS "profiles_select_own_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own_simple" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile role" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update_roles" ON public.profiles;

-- Recrear políticas optimizadas (sin duplicados)
CREATE POLICY "profiles_select_own_simple" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "profiles_insert_own_simple" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "profiles_update_own_simple" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "profiles_delete_own_simple" ON public.profiles
  FOR DELETE
  TO authenticated
  USING (id = (select auth.uid()));

-- Políticas de admin optimizadas (consolidadas)
CREATE POLICY "profiles_admin_select_all" ON public.profiles
  FOR SELECT
  USING ((select public.is_admin()));

CREATE POLICY "profiles_admin_update_roles" ON public.profiles
  FOR UPDATE
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

-- ============================================================================
-- 2. OPTIMIZAR POLÍTICAS DE API_KEYS
-- ============================================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can create own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete own API keys" ON public.api_keys;

-- Recrear políticas optimizadas
CREATE POLICY "Users can view own API keys" ON public.api_keys
  FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own API keys" ON public.api_keys
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own API keys" ON public.api_keys
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own API keys" ON public.api_keys
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- 3. OPTIMIZAR POLÍTICAS DE PARTIAL_PAYMENTS
-- ============================================================================

-- Verificar si las políticas existen antes de optimizarlas
-- Las políticas de partial_payments ya deberían estar optimizadas en migración 013,
-- pero verificamos y optimizamos si es necesario

DO $$
BEGIN
  -- Optimizar políticas de partial_payments si existen
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'partial_payments' AND policyname = 'Users can view payments for their quotes') THEN
    DROP POLICY IF EXISTS "Users can view payments for their quotes" ON public.partial_payments;
    CREATE POLICY "Users can view payments for their quotes" ON public.partial_payments
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.quotes q
          WHERE q.id = partial_payments.quote_id
          AND ((select auth.uid()) = q.vendor_id OR (select public.is_admin()))
        )
      );
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'partial_payments' AND policyname = 'Users can create payments for their quotes') THEN
    DROP POLICY IF EXISTS "Users can create payments for their quotes" ON public.partial_payments;
    CREATE POLICY "Users can create payments for their quotes" ON public.partial_payments
      FOR INSERT
      WITH CHECK (
        (select auth.uid()) IS NOT NULL
        OR (select public.is_admin())
      );
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'partial_payments' AND policyname = 'Users can update their own payments') THEN
    DROP POLICY IF EXISTS "Users can update their own payments" ON public.partial_payments;
    CREATE POLICY "Users can update their own payments" ON public.partial_payments
      FOR UPDATE
      USING ((select auth.uid()) = created_by)
      WITH CHECK ((select auth.uid()) = created_by);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'partial_payments' AND policyname = 'Users can delete their own payments') THEN
    DROP POLICY IF EXISTS "Users can delete their own payments" ON public.partial_payments;
    CREATE POLICY "Users can delete their own payments" ON public.partial_payments
      FOR DELETE
      USING ((select auth.uid()) = created_by);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'partial_payments' AND policyname = 'Admins can view all payments') THEN
    DROP POLICY IF EXISTS "Admins can view all payments" ON public.partial_payments;
    CREATE POLICY "Admins can view all payments" ON public.partial_payments
      FOR SELECT
      USING ((select public.is_admin()));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'partial_payments' AND policyname = 'Admins can create payments for any quote') THEN
    DROP POLICY IF EXISTS "Admins can create payments for any quote" ON public.partial_payments;
    CREATE POLICY "Admins can create payments for any quote" ON public.partial_payments
      FOR INSERT
      WITH CHECK ((select public.is_admin()));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'partial_payments' AND policyname = 'Admins can update any payment') THEN
    DROP POLICY IF EXISTS "Admins can update any payment" ON public.partial_payments;
    CREATE POLICY "Admins can update any payment" ON public.partial_payments
      FOR UPDATE
      USING ((select public.is_admin()))
      WITH CHECK ((select public.is_admin()));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'partial_payments' AND policyname = 'Admins can delete any payment') THEN
    DROP POLICY IF EXISTS "Admins can delete any payment" ON public.partial_payments;
    CREATE POLICY "Admins can delete any payment" ON public.partial_payments
      FOR DELETE
      USING ((select public.is_admin()));
  END IF;
END $$;

-- ============================================================================
-- Comentarios para documentación
-- ============================================================================

COMMENT ON POLICY "profiles_select_own_simple" ON public.profiles IS 
'Política optimizada: Usa (select auth.uid()) para mejor rendimiento';

COMMENT ON POLICY "profiles_insert_own_simple" ON public.profiles IS 
'Política optimizada: Usa (select auth.uid()) para mejor rendimiento';

COMMENT ON POLICY "profiles_update_own_simple" ON public.profiles IS 
'Política optimizada: Usa (select auth.uid()) para mejor rendimiento';

COMMENT ON POLICY "profiles_delete_own_simple" ON public.profiles IS 
'Política optimizada: Usa (select auth.uid()) para mejor rendimiento';

COMMENT ON POLICY "profiles_admin_select_all" ON public.profiles IS 
'Política optimizada: Usa (select is_admin()) para mejor rendimiento';

COMMENT ON POLICY "profiles_admin_update_roles" ON public.profiles IS 
'Política optimizada: Usa (select is_admin()) para mejor rendimiento';

COMMENT ON POLICY "Users can view own API keys" ON public.api_keys IS 
'Política optimizada: Usa (select auth.uid()) para mejor rendimiento';

COMMENT ON POLICY "Users can create own API keys" ON public.api_keys IS 
'Política optimizada: Usa (select auth.uid()) para mejor rendimiento';

COMMENT ON POLICY "Users can update own API keys" ON public.api_keys IS 
'Política optimizada: Usa (select auth.uid()) para mejor rendimiento';

COMMENT ON POLICY "Users can delete own API keys" ON public.api_keys IS 
'Política optimizada: Usa (select auth.uid()) para mejor rendimiento';

