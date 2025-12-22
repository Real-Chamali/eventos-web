-- ============================================================================
-- QUERY DE VERIFICACIÓN - Migración 015
-- ============================================================================
-- Ejecuta esta query en Supabase SQL Editor para verificar si la migración 015
-- ya está aplicada o si necesita aplicarse.
-- ============================================================================

-- 1. Verificar vista event_financial_summary
SELECT 
  '1. Vista event_financial_summary' as check_item,
  viewname, 
  viewowner,
  CASE 
    WHEN viewname = 'event_financial_summary' THEN '✅ Vista existe'
    ELSE '❌ Vista NO existe - Necesita migración'
  END as estado
FROM pg_views 
WHERE viewname = 'event_financial_summary'
UNION ALL

-- 2. Verificar RLS en quotes_history
SELECT 
  '2. RLS en quotes_history' as check_item,
  tablename as viewname,
  NULL::name as viewowner,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS habilitado'
    ELSE '❌ RLS NO habilitado - Necesita migración'
  END as estado
FROM pg_tables 
WHERE tablename = 'quotes_history' 
AND schemaname = 'public'
UNION ALL

-- 3. Verificar RLS en quote_items_history
SELECT 
  '3. RLS en quote_items_history' as check_item,
  tablename as viewname,
  NULL::name as viewowner,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS habilitado'
    ELSE '❌ RLS NO habilitado - Necesita migración'
  END as estado
FROM pg_tables 
WHERE tablename = 'quote_items_history' 
AND schemaname = 'public'
UNION ALL

-- 4. Verificar search_path en función is_admin
SELECT 
  '4. search_path en is_admin' as check_item,
  proname as viewname,
  NULL::name as viewowner,
  CASE 
    WHEN prosrc LIKE '%SET search_path%' THEN '✅ search_path configurado'
    ELSE '❌ search_path NO configurado - Necesita migración'
  END as estado
FROM pg_proc 
WHERE proname = 'is_admin' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
UNION ALL

-- 5. Verificar políticas RLS en quotes_history
SELECT 
  '5. Políticas RLS quotes_history' as check_item,
  policyname as viewname,
  NULL::name as viewowner,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Políticas existen'
    ELSE '❌ Políticas NO existen - Necesita migración'
  END as estado
FROM pg_policies 
WHERE tablename = 'quotes_history'
GROUP BY policyname
UNION ALL

-- 6. Verificar políticas RLS en quote_items_history
SELECT 
  '6. Políticas RLS quote_items_history' as check_item,
  policyname as viewname,
  NULL::name as viewowner,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Políticas existen'
    ELSE '❌ Políticas NO existen - Necesita migración'
  END as estado
FROM pg_policies 
WHERE tablename = 'quote_items_history'
GROUP BY policyname;

-- ============================================================================
-- RESUMEN
-- ============================================================================
-- Si TODOS muestran ✅: La migración ya está aplicada
-- Si alguno muestra ❌: Necesitas aplicar la migración 015
-- ============================================================================

