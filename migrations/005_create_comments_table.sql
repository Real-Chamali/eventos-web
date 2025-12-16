-- ============================================================================
-- Migración 005: Crear tabla de comentarios
-- ============================================================================
-- Sistema de comentarios y colaboración con @mentions
-- IMPORTANTE: Aplicar después de la migración 003 (fix_profiles_rls_recursion)
-- ============================================================================

-- Crear tabla de comentarios
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('quote', 'event', 'client')),
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (LENGTH(content) > 0),
  mentions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Crear Índices para Performance
-- ============================================================================

-- Índice compuesto para búsqueda por entidad
CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);

-- Índice por user_id para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- Índice por created_at para ordenamiento temporal
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Índice GIN para búsqueda en mentions array
CREATE INDEX IF NOT EXISTS idx_comments_mentions ON comments USING GIN(mentions);

-- ============================================================================
-- Habilitar Row Level Security (RLS)
-- ============================================================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

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

-- Policy 1: Los usuarios pueden ver comentarios de entidades a las que tienen acceso
CREATE POLICY comments_select ON comments
  FOR SELECT
  USING (
    -- Para quotes: ver si el usuario es el vendor o admin
    (entity_type = 'quote' AND EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = comments.entity_id
      AND (q.vendor_id = auth.uid() OR public.is_admin())
    ))
    OR
    -- Para events: similar lógica
    (entity_type = 'event' AND EXISTS (
      SELECT 1 FROM events e
      JOIN quotes q ON q.id = e.quote_id
      WHERE e.id = comments.entity_id
      AND (q.vendor_id = auth.uid() OR public.is_admin())
    ))
    OR
    -- Para clients: todos los usuarios autenticados pueden ver
    (entity_type = 'client' AND auth.uid() IS NOT NULL)
    OR
    -- Admin puede ver todo
    public.is_admin()
  );

-- Policy 2: Los usuarios pueden crear comentarios en entidades a las que tienen acceso
CREATE POLICY comments_insert ON comments
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      (entity_type = 'quote' AND EXISTS (
        SELECT 1 FROM quotes q
        WHERE q.id = comments.entity_id
        AND (q.vendor_id = auth.uid() OR public.is_admin())
      ))
      OR
      (entity_type = 'event' AND EXISTS (
        SELECT 1 FROM events e
        JOIN quotes q ON q.id = e.quote_id
        WHERE e.id = comments.entity_id
        AND (q.vendor_id = auth.uid() OR public.is_admin())
      ))
      OR
      (entity_type = 'client' AND auth.uid() IS NOT NULL)
      OR
      public.is_admin()
    )
  );

-- Policy 3: Los usuarios pueden actualizar sus propios comentarios
CREATE POLICY comments_update_own ON comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Los usuarios pueden eliminar sus propios comentarios o admin puede eliminar cualquier comentario
CREATE POLICY comments_delete ON comments
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  );

-- ============================================================================
-- Trigger para updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_updated_at();

-- ============================================================================
-- Comentarios para Documentación
-- ============================================================================

COMMENT ON TABLE comments IS 'Sistema de comentarios y colaboración con soporte para @mentions';
COMMENT ON COLUMN comments.entity_type IS 'Tipo de entidad: quote, event, client';
COMMENT ON COLUMN comments.entity_id IS 'ID de la entidad comentada';
COMMENT ON COLUMN comments.content IS 'Contenido del comentario (requerido, no vacío)';
COMMENT ON COLUMN comments.mentions IS 'Array de usuarios mencionados con @';
