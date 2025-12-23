-- ============================================================================
-- Migración 022: Agregar índices a foreign keys faltantes
-- ============================================================================
-- Problema: Algunas foreign keys no tienen índices, lo que puede impactar
-- el performance de joins y consultas.
-- ============================================================================

-- Índice para quote_items.service_id
-- Mejora performance de joins entre quote_items y services
CREATE INDEX IF NOT EXISTS idx_quote_items_service_id 
  ON quote_items(service_id);

-- Índice para quote_versions.client_id
-- Mejora performance de joins entre quote_versions y clients
CREATE INDEX IF NOT EXISTS idx_quote_versions_client_id 
  ON quote_versions(client_id);

-- Índice para service_price_rules.service_id
-- Mejora performance de joins entre service_price_rules y services
CREATE INDEX IF NOT EXISTS idx_service_price_rules_service_id 
  ON service_price_rules(service_id);

-- Comentarios para documentación
COMMENT ON INDEX idx_quote_items_service_id IS 
'Índice en foreign key service_id de quote_items para mejorar performance de joins con services';

COMMENT ON INDEX idx_quote_versions_client_id IS 
'Índice en foreign key client_id de quote_versions para mejorar performance de joins con clients';

COMMENT ON INDEX idx_service_price_rules_service_id IS 
'Índice en foreign key service_id de service_price_rules para mejorar performance de joins con services';

