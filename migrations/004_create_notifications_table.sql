-- ============================================================================
-- Migración 004: Crear tabla de notificaciones
-- ============================================================================
-- Sistema de notificaciones en tiempo real para características premium
-- IMPORTANTE: Aplicar después de la migración 003 (fix_profiles_rls_recursion)
-- ============================================================================

-- Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('quote', 'event', 'payment', 'reminder', 'system')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Crear Índices para Performance
-- ============================================================================

-- Índice por user_id para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Índice compuesto para notificaciones no leídas por usuario
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read) WHERE read = FALSE;

-- Índice por created_at para ordenamiento temporal
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Índice por type para filtros
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ============================================================================
-- Habilitar Row Level Security (RLS)
-- ============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Asegurar que la función is_admin() existe
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'user_role') = 'admin',
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
$$;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy 1: Los usuarios solo pueden ver sus propias notificaciones
CREATE POLICY notifications_select_own ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Solo el sistema puede crear notificaciones (via service role o función)
-- Los usuarios no pueden crear notificaciones manualmente
-- Esta política se maneja mediante función SECURITY DEFINER

-- Policy 3: Los usuarios pueden actualizar sus propias notificaciones (marcar como leídas)
CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Los usuarios NO pueden eliminar notificaciones (mantener historial)
-- No se crea política DELETE

-- ============================================================================
-- Trigger para actualizar updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- ============================================================================
-- Función helper para crear notificaciones (usar con service role)
-- ============================================================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID 
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Validar tipo
  IF p_type NOT IN ('quote', 'event', 'payment', 'reminder', 'system') THEN
    RAISE EXCEPTION 'Invalid notification type: %', p_type;
  END IF;

  -- Insertar notificación
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_metadata)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comentarios para Documentación
-- ============================================================================

COMMENT ON TABLE notifications IS 'Sistema de notificaciones en tiempo real para la aplicación';
COMMENT ON COLUMN notifications.id IS 'Identificador único de la notificación';
COMMENT ON COLUMN notifications.user_id IS 'Usuario destinatario de la notificación';
COMMENT ON COLUMN notifications.type IS 'Tipo de notificación: quote, event, payment, reminder, system';
COMMENT ON COLUMN notifications.read IS 'Indica si la notificación ha sido leída';
COMMENT ON COLUMN notifications.metadata IS 'Metadatos adicionales en formato JSON';
COMMENT ON FUNCTION create_notification(UUID, VARCHAR, VARCHAR, TEXT, JSONB) IS 'Crea una notificación para un usuario. Usar con service role.';
