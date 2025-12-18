-- Migración para crear tabla de API keys
-- Fecha: 2025-01-XX
-- Descripción: Crea tabla para gestionar API keys de usuarios con hash seguro

-- 1. Crear tabla api_keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  permissions TEXT[] DEFAULT ARRAY['read', 'write'],
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- 3. Política: Usuarios pueden ver sus propias API keys
CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Política: Usuarios pueden crear sus propias API keys
CREATE POLICY "Users can create own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Política: Usuarios pueden actualizar sus propias API keys
CREATE POLICY "Users can update own API keys"
  ON api_keys FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Política: Usuarios pueden eliminar sus propias API keys
CREATE POLICY "Users can delete own API keys"
  ON api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Política: Servicio puede leer todas las API keys para validación (usando service_role)
-- Esta política permite que el servicio valide API keys sin necesidad de autenticación de usuario
-- IMPORTANTE: Solo funciona con service_role key, no con anon key

-- 8. Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at) WHERE expires_at IS NOT NULL;

-- 9. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Trigger para updated_at
CREATE TRIGGER update_api_keys_updated_at
BEFORE UPDATE ON api_keys
FOR EACH ROW
EXECUTE FUNCTION update_api_keys_updated_at();

-- 11. Función helper para validar API key (puede ser usada desde el código del servidor)
CREATE OR REPLACE FUNCTION validate_api_key(api_key_hash TEXT)
RETURNS TABLE (
  user_id UUID,
  permissions TEXT[],
  is_valid BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ak.user_id,
    ak.permissions,
    CASE 
      WHEN ak.is_active = true 
        AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
      THEN true
      ELSE false
    END as is_valid
  FROM api_keys ak
  WHERE ak.key_hash = api_key_hash
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Comentarios
COMMENT ON TABLE api_keys IS 'Tabla para gestionar API keys de usuarios con hash seguro';
COMMENT ON COLUMN api_keys.key_hash IS 'Hash SHA-256 de la API key (nunca almacenar la key en texto plano)';
COMMENT ON COLUMN api_keys.permissions IS 'Array de permisos: read, write, delete, admin';
COMMENT ON FUNCTION validate_api_key IS 'Función helper para validar API keys desde código del servidor (requiere service_role)';

