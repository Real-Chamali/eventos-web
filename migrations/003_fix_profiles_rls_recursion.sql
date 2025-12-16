-- ============================================================================
-- Migración: Corregir recursión infinita en políticas RLS de profiles
-- ============================================================================
-- Problema: Las políticas RLS de profiles consultan la misma tabla profiles,
-- causando recursión infinita (error 42P17)
-- Solución: Eliminar políticas problemáticas y crear políticas simples
-- ============================================================================

-- Eliminar políticas que causan recursión
DROP POLICY IF EXISTS "profiles_allow_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;

-- Eliminar políticas duplicadas o innecesarias
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;

-- ============================================================================
-- Crear políticas simples que NO causan recursión
-- ============================================================================

-- Política 1: SELECT - Usuarios pueden leer su propio perfil
-- Simple: solo verifica auth.uid() = id, sin consultar profiles
CREATE POLICY "profiles_select_own_simple"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Política 2: INSERT - Usuarios pueden crear su propio perfil
CREATE POLICY "profiles_insert_own_simple"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Política 3: UPDATE - Usuarios pueden actualizar su propio perfil
CREATE POLICY "profiles_update_own_simple"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Política 4: DELETE - Solo el mismo usuario puede eliminar su perfil
CREATE POLICY "profiles_delete_own_simple"
ON public.profiles
FOR DELETE
TO authenticated
USING (id = auth.uid());

-- ============================================================================
-- Mantener políticas específicas para middleware si existen
-- ============================================================================

-- Estas políticas son más restrictivas y se usan en middleware
-- Si ya existen, no las recreamos para evitar conflictos
-- Si no existen, se crean automáticamente arriba

-- ============================================================================
-- Modificar función is_admin() para evitar recursión cuando se usa en RLS
-- ============================================================================
-- NOTA: Esta función NO debe usarse en políticas RLS de profiles
-- porque causa recursión. Solo se usa en otras tablas.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  -- Primero intentar obtener el rol del JWT (más rápido, sin consultar DB)
  SELECT COALESCE(
    (auth.jwt() ->> 'user_role') = 'admin',
    false
  );
$$;

-- ============================================================================
-- Comentarios explicativos
-- ============================================================================

COMMENT ON FUNCTION public.is_admin() IS 
'Verifica si el usuario actual es admin. NO usar en políticas RLS de profiles para evitar recursión.';

COMMENT ON POLICY "profiles_select_own_simple" ON public.profiles IS 
'Permite a usuarios leer su propio perfil. Simple sin recursión.';

COMMENT ON POLICY "profiles_insert_own_simple" ON public.profiles IS 
'Permite a usuarios crear su propio perfil. Simple sin recursión.';

COMMENT ON POLICY "profiles_update_own_simple" ON public.profiles IS 
'Permite a usuarios actualizar su propio perfil. Simple sin recursión.';

COMMENT ON POLICY "profiles_delete_own_simple" ON public.profiles IS 
'Permite a usuarios eliminar su propio perfil. Simple sin recursión.';

