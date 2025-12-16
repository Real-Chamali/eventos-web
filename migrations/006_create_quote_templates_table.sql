-- Tabla de plantillas de cotizaciones
CREATE TABLE IF NOT EXISTS quote_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(100),
  services JSONB DEFAULT '[]', -- Array de servicios pre-configurados
  default_notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE, -- Si es pública, todos pueden usarla
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_quote_templates_created_by ON quote_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_quote_templates_event_type ON quote_templates(event_type);
CREATE INDEX IF NOT EXISTS idx_quote_templates_is_public ON quote_templates(is_public);

-- RLS Policies
ALTER TABLE quote_templates ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver plantillas públicas o sus propias plantillas
CREATE POLICY quote_templates_select ON quote_templates
  FOR SELECT
  USING (
    is_public = TRUE
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Los usuarios pueden crear sus propias plantillas
CREATE POLICY quote_templates_insert ON quote_templates
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Los usuarios pueden actualizar sus propias plantillas o admin puede actualizar cualquier plantilla
CREATE POLICY quote_templates_update ON quote_templates
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Los usuarios pueden eliminar sus propias plantillas o admin puede eliminar cualquier plantilla
CREATE POLICY quote_templates_delete ON quote_templates
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_quote_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quote_templates_updated_at
  BEFORE UPDATE ON quote_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_templates_updated_at();

