-- ============================================================================
-- Script de Prueba: Crear Notificación de Prueba
-- ============================================================================
-- Este script crea una notificación de prueba para verificar que:
-- 1. La función create_notification funciona correctamente
-- 2. Realtime está habilitado y funciona
-- 3. Las notificaciones aparecen en tiempo real en la aplicación
-- ============================================================================

-- INSTRUCCIONES:
-- 1. Ejecutar este script en Supabase SQL Editor
-- 2. Abrir la aplicación en el navegador (sin recargar) con tu usuario autenticado
-- 3. La notificación debería aparecer automáticamente en tiempo real

-- Tu User ID
-- 0f5f8080-5bfb-4f8a-a110-09887a250d7a

-- Crear notificación de prueba
SELECT create_notification(
  '0f5f8080-5bfb-4f8a-a110-09887a250d7a'::uuid,
  'system'::varchar,
  'Notificación de Prueba'::varchar,
  'Esta es una notificación de prueba. Si la ves en tiempo real sin recargar la página, ¡Realtime está funcionando correctamente! 🎉'::text,
  jsonb_build_object(
    'test', true,
    'timestamp', NOW()::text
  )
) as notification_id;

-- Verificar que la notificación se creó
SELECT 
    id,
    user_id,
    type,
    title,
    message,
    read,
    created_at
FROM notifications
WHERE user_id = '0f5f8080-5bfb-4f8a-a110-09887a250d7a'::uuid
ORDER BY created_at DESC
LIMIT 1;

-- ============================================================================
-- Notas:
-- - Este script usa tu User ID: 0f5f8080-5bfb-4f8a-a110-09887a250d7a
-- - La notificación debería aparecer automáticamente en NotificationCenter
-- - Asegúrate de estar autenticado en la aplicación con tu usuario
-- - Si quieres probar con otro usuario, cambia el UUID en las líneas anteriores
-- ============================================================================

