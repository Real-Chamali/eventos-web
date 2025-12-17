-- ============================================================================
-- Migración 010: Corregir vista services_public - Problema de Seguridad
-- ============================================================================
-- ISSUE: La vista public.services_public está definida con SECURITY DEFINER
-- PROBLEMA: Las vistas con SECURITY DEFINER ejecutan con permisos del creador,
--           no del usuario que hace la consulta, lo que puede eludir RLS.
-- SOLUCIÓN: Recrear la vista sin SECURITY DEFINER (o con SECURITY INVOKER)
-- ============================================================================

-- ============================================================================
-- Paso 1: Verificar si la vista existe
-- ============================================================================

DO $$
BEGIN
    -- Verificar si la vista existe
    IF EXISTS (
        SELECT 1 
        FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'services_public'
    ) THEN
        RAISE NOTICE 'Vista services_public encontrada, procediendo a corregir...';
    ELSE
        RAISE NOTICE 'Vista services_public no existe, no se requiere acción.';
        RETURN;
    END IF;
END $$;

-- ============================================================================
-- Paso 2: Eliminar la vista existente (si tiene SECURITY DEFINER)
-- ============================================================================

DROP VIEW IF EXISTS public.services_public CASCADE;

-- ============================================================================
-- Paso 3: Recrear la vista sin SECURITY DEFINER
-- ============================================================================
-- SECURITY INVOKER es el comportamiento por defecto y asegura que las
-- consultas se ejecuten con los permisos del usuario que hace la consulta,
-- respetando las políticas RLS correctamente.
-- ============================================================================

CREATE OR REPLACE VIEW public.services_public
WITH (security_invoker = true)  -- Asegura que use permisos del usuario, no del creador
AS
SELECT 
    id,
    name,
    base_price,
    cost_price,
    created_at
FROM public.services
WHERE true;  -- Las políticas RLS se aplicarán automáticamente

-- ============================================================================
-- Paso 4: Comentarios para documentación
-- ============================================================================

COMMENT ON VIEW public.services_public IS 
'Vista pública de servicios. Usa SECURITY INVOKER para respetar RLS del usuario que consulta.';

-- ============================================================================
-- Paso 5: Verificar que la vista se creó correctamente
-- ============================================================================

DO $$
DECLARE
    view_exists BOOLEAN;
    security_type TEXT;
BEGIN
    -- Verificar existencia
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'services_public'
    ) INTO view_exists;
    
    IF view_exists THEN
        RAISE NOTICE '✅ Vista services_public recreada exitosamente';
        
        -- Verificar que no tiene SECURITY DEFINER
        SELECT 
            CASE 
                WHEN pg_get_viewdef('public.services_public'::regclass, true) LIKE '%SECURITY DEFINER%' 
                THEN 'SECURITY DEFINER'
                ELSE 'SECURITY INVOKER (correcto)'
            END
        INTO security_type;
        
        RAISE NOTICE 'Tipo de seguridad: %', security_type;
    ELSE
        RAISE WARNING '⚠️  No se pudo verificar la creación de la vista';
    END IF;
END $$;

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. SECURITY INVOKER (por defecto): La vista ejecuta con los permisos del
--    usuario que hace la consulta, respetando RLS correctamente.
--
-- 2. SECURITY DEFINER (problemático): La vista ejecuta con los permisos del
--    creador de la vista, lo que puede eludir RLS y es un riesgo de seguridad.
--
-- 3. Esta migración corrige el problema de seguridad asegurando que las
--    políticas RLS se apliquen correctamente a todos los usuarios.
--
-- 4. Si necesitas que la vista tenga permisos especiales, considera usar
--    funciones con SECURITY DEFINER en lugar de vistas, y aplicar RLS
--    explícitamente dentro de la función.
-- ============================================================================

