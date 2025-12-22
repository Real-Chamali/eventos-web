-- ============================================================================
-- Script de Prueba: Verificar Sistema de Notificaciones
-- ============================================================================
-- Este script ayuda a verificar que el sistema de notificaciones funciona correctamente
-- ============================================================================

-- 1. Verificar que la tabla existe y tiene RLS habilitado
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'notifications';

-- 2. Verificar políticas RLS
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY cmd;

-- 3. Verificar que la función create_notification es SECURITY DEFINER
SELECT 
  proname as function_name,
  prosecdef as security_definer,
  proconfig as search_path_config
FROM pg_proc 
WHERE proname = 'create_notification';

-- 4. Verificar que Realtime está habilitado para notifications
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'notifications';

-- 5. Contar notificaciones existentes (si hay)
SELECT 
  type,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE read = false) as unread_count
FROM notifications
GROUP BY type
ORDER BY type;

-- 6. Ver últimas 10 notificaciones
SELECT 
  id,
  user_id,
  type,
  title,
  read,
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- PRUEBA MANUAL: Crear una notificación de prueba
-- ============================================================================
-- Reemplaza USER_ID_AQUI con un UUID de usuario real de tu base de datos
-- 
-- SELECT create_notification(
--   'USER_ID_AQUI'::UUID,
--   'system',
--   'Notificación de Prueba',
--   'Esta es una notificación de prueba para verificar que el sistema funciona',
--   '{"test": true}'::jsonb
-- );
-- ============================================================================

