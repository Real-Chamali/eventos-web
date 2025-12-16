-- Tabla de comentarios para colaboración
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('quote', 'event', 'client')),
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mentions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- RLS Policies
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver comentarios de entidades a las que tienen acceso
CREATE POLICY comments_select ON comments
  FOR SELECT
  USING (
    -- Para quotes: ver si el usuario es el vendor o admin
    (entity_type = 'quote' AND EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = comments.entity_id
      AND (q.vendor_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
      ))
    ))
    OR
    -- Para events: similar lógica
    (entity_type = 'event' AND EXISTS (
      SELECT 1 FROM events e
      JOIN quotes q ON q.id = e.quote_id
      WHERE e.id = comments.entity_id
      AND (q.vendor_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
      ))
    ))
    OR
    -- Para clients: todos los usuarios pueden ver
    (entity_type = 'client')
    OR
    -- Admin puede ver todo
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Los usuarios pueden crear comentarios en entidades a las que tienen acceso
CREATE POLICY comments_insert ON comments
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      (entity_type = 'quote' AND EXISTS (
        SELECT 1 FROM quotes q
        WHERE q.id = comments.entity_id
        AND (q.vendor_id = auth.uid() OR EXISTS (
          SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        ))
      ))
      OR
      (entity_type = 'event' AND EXISTS (
        SELECT 1 FROM events e
        JOIN quotes q ON q.id = e.quote_id
        WHERE e.id = comments.entity_id
        AND (q.vendor_id = auth.uid() OR EXISTS (
          SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        ))
      ))
      OR
      (entity_type = 'client')
      OR
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    )
  );

-- Los usuarios pueden actualizar sus propios comentarios
CREATE POLICY comments_update_own ON comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propios comentarios o admin puede eliminar cualquier comentario
CREATE POLICY comments_delete ON comments
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Trigger para updated_at
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

