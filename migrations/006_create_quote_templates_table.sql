-- ============================================================================
-- Migración 006: Crear tabla de plantillas de cotizaciones
-- ============================================================================
-- Sistema de plantillas reutilizables para cotizaciones
-- IMPORTANTE: Aplicar después de la migración 003 (fix_profiles_rls_recursion)
-- ============================================================================

-- Crear tabla de plantillas de cotizaciones
CREATE TABLE IF NOT EXISTS quote_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL CHECK (LENGTH(name) > 0),
  description TEXT,
  event_type VARCHAR(100),
  services JSONB DEFAULT '[]'::JSONB, -- Array de servicios pre-configurados
  default_notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE, -- Si es pública, todos pueden usarla
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Crear Índices para Performance
-- ============================================================================

-- Índice por created_by para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_quote_templates_created_by ON quote_templates(created_by);

-- Índice por event_type para filtros
CREATE INDEX IF NOT EXISTS idx_quote_templates_event_type ON quote_templates(event_type);

-- Índice por is_public para búsquedas de plantillas públicas
CREATE INDEX IF NOT EXISTS idx_quote_templates_is_public ON quote_templates(is_public) WHERE is_public = TRUE;

-- Índice compuesto para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_quote_templates_public_type ON quote_templates(is_public, event_type) WHERE is_public = TRUE;

-- ============================================================================
-- Habilitar Row Level Security (RLS)
-- ============================================================================

ALTER TABLE quote_templates ENABLE ROW LEVEL SECURITY;

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

-- Policy 1: Los usuarios pueden ver plantillas públicas o sus propias plantillas
CREATE POLICY quote_templates_select ON quote_templates
  FOR SELECT
  USING (
    is_public = TRUE
    OR created_by = auth.uid()
    OR public.is_admin()
  );

-- Policy 2: Los usuarios pueden crear sus propias plantillas
CREATE POLICY quote_templates_insert ON quote_templates
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Policy 3: Los usuarios pueden actualizar sus propias plantillas o admin puede actualizar cualquier plantilla
CREATE POLICY quote_templates_update ON quote_templates
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR public.is_admin()
  )
  WITH CHECK (
    created_by = auth.uid()
    OR public.is_admin()
  );

-- Policy 4: Los usuarios pueden eliminar sus propias plantillas o admin puede eliminar cualquier plantilla
CREATE POLICY quote_templates_delete ON quote_templates
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR public.is_admin()
  );

-- ============================================================================
-- Trigger para updated_at
-- ============================================================================

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

-- ============================================================================
-- Comentarios para Documentación
-- ============================================================================

COMMENT ON TABLE quote_templates IS 'Plantillas reutilizables de cotizaciones para ahorrar tiempo';
COMMENT ON COLUMN quote_templates.name IS 'Nombre de la plantilla (requerido, no vacío)';
COMMENT ON COLUMN quote_templates.services IS 'Array JSON de servicios pre-configurados';
COMMENT ON COLUMN quote_templates.is_public IS 'Si es TRUE, todos los usuarios pueden usar esta plantilla';
COMMENT ON COLUMN quote_templates.created_by IS 'Usuario que creó la plantilla';
