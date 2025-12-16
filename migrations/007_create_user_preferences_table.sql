-- ============================================================================
-- Migración 007: Crear tabla de preferencias de usuario
-- ============================================================================
-- Sistema de preferencias personalizables por usuario
-- IMPORTANTE: Aplicar después de la migración 003 (fix_profiles_rls_recursion)
-- ============================================================================

-- Crear tabla de preferencias de usuario
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme VARCHAR(10) DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
  language VARCHAR(10) DEFAULT 'es' CHECK (language IN ('es', 'en')),
  timezone VARCHAR(100) DEFAULT 'America/Mexico_City',
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Habilitar Row Level Security (RLS)
-- ============================================================================

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy 1: Los usuarios solo pueden ver sus propias preferencias
CREATE POLICY user_preferences_select_own ON user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Los usuarios solo pueden crear sus propias preferencias
CREATE POLICY user_preferences_insert_own ON user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Los usuarios solo pueden actualizar sus propias preferencias
CREATE POLICY user_preferences_update_own ON user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Los usuarios solo pueden eliminar sus propias preferencias
CREATE POLICY user_preferences_delete_own ON user_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Trigger para updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- ============================================================================
-- Comentarios para Documentación
-- ============================================================================

COMMENT ON TABLE user_preferences IS 'Preferencias personalizables por usuario';
COMMENT ON COLUMN user_preferences.theme IS 'Tema: light, dark, o auto (sigue preferencia del sistema)';
COMMENT ON COLUMN user_preferences.language IS 'Idioma: es (español) o en (inglés)';
COMMENT ON COLUMN user_preferences.timezone IS 'Zona horaria en formato IANA (ej: America/Mexico_City)';
COMMENT ON COLUMN user_preferences.email_notifications IS 'Si el usuario quiere recibir notificaciones por email';
COMMENT ON COLUMN user_preferences.push_notifications IS 'Si el usuario quiere recibir notificaciones push';
