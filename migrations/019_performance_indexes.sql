-- ============================================================================
-- Migración 019: Índices de Performance
-- ============================================================================
-- Esta migración agrega índices adicionales para optimizar consultas frecuentes
-- Mejora el rendimiento de queries en el dashboard y listas
-- ============================================================================

-- ============================================================================
-- 1. Índices para Tabla quotes (consultas frecuentes)
-- ============================================================================

-- Índice compuesto para búsquedas por vendor y status (muy común en dashboard)
CREATE INDEX IF NOT EXISTS idx_quotes_vendor_status 
ON quotes(vendor_id, status) 
WHERE status IN ('DRAFT', 'APPROVED', 'REJECTED');

-- Índice para búsquedas por fecha de creación (ordenamiento en dashboard)
CREATE INDEX IF NOT EXISTS idx_quotes_created_at_desc 
ON quotes(created_at DESC);

-- Índice compuesto para búsquedas por vendor y fecha (dashboard reciente)
CREATE INDEX IF NOT EXISTS idx_quotes_vendor_created 
ON quotes(vendor_id, created_at DESC);

-- Índice para búsquedas por cliente (relaciones)
CREATE INDEX IF NOT EXISTS idx_quotes_client_id 
ON quotes(client_id) 
WHERE client_id IS NOT NULL;

-- ============================================================================
-- 2. Índices para Tabla clients (búsquedas frecuentes)
-- ============================================================================

-- Índice para búsquedas por created_by (filtros por vendedor)
CREATE INDEX IF NOT EXISTS idx_clients_created_by 
ON clients(created_by) 
WHERE created_by IS NOT NULL;

-- Índice para búsquedas por nombre (búsquedas de texto)
CREATE INDEX IF NOT EXISTS idx_clients_name 
ON clients(name);

-- ============================================================================
-- 3. Índices para Tabla events (calendario y listas)
-- ============================================================================

-- Índice compuesto para búsquedas por fecha (calendario)
CREATE INDEX IF NOT EXISTS idx_events_dates 
ON events(start_date, end_date) 
WHERE start_date IS NOT NULL;

-- Índice para búsquedas por quote_id (relaciones)
CREATE INDEX IF NOT EXISTS idx_events_quote_id 
ON events(quote_id) 
WHERE quote_id IS NOT NULL;

-- ============================================================================
-- 4. Índices para Tabla partial_payments (finanzas)
-- ============================================================================

-- Índice para búsquedas por quote_id (cálculo de pagos)
CREATE INDEX IF NOT EXISTS idx_partial_payments_quote_id 
ON partial_payments(quote_id) 
WHERE quote_id IS NOT NULL;

-- Índice para búsquedas por fecha de pago (reportes)
CREATE INDEX IF NOT EXISTS idx_partial_payments_payment_date 
ON partial_payments(payment_date DESC) 
WHERE payment_date IS NOT NULL;

-- ============================================================================
-- 5. Índices para Tabla quote_services (relaciones)
-- ============================================================================

-- Índice para búsquedas por quote_id (muy común)
CREATE INDEX IF NOT EXISTS idx_quote_services_quote_id 
ON quote_services(quote_id);

-- Índice para búsquedas por service_id (estadísticas)
CREATE INDEX IF NOT EXISTS idx_quote_services_service_id 
ON quote_services(service_id);

-- ============================================================================
-- 6. Índices para Tabla finance_ledger (reportes financieros)
-- ============================================================================

-- Índice compuesto para búsquedas por evento y tipo (reportes)
CREATE INDEX IF NOT EXISTS idx_finance_ledger_event_type 
ON finance_ledger(event_id, type) 
WHERE event_id IS NOT NULL;

-- Índice para búsquedas por fecha (reportes temporales)
CREATE INDEX IF NOT EXISTS idx_finance_ledger_created_at 
ON finance_ledger(created_at DESC);

-- ============================================================================
-- 7. Índices para Tabla profiles (búsquedas de roles)
-- ============================================================================

-- Índice para búsquedas por rol (muy común en checkAdmin)
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON profiles(role) 
WHERE role IS NOT NULL;

-- Índice compuesto para búsquedas por rol y id (optimización checkAdmin)
CREATE INDEX IF NOT EXISTS idx_profiles_id_role 
ON profiles(id, role);

-- ============================================================================
-- Comentarios para Documentación
-- ============================================================================

COMMENT ON INDEX idx_quotes_vendor_status IS 'Optimiza búsquedas de cotizaciones por vendedor y estado (dashboard)';
COMMENT ON INDEX idx_quotes_created_at_desc IS 'Optimiza ordenamiento por fecha de creación (listas recientes)';
COMMENT ON INDEX idx_quotes_vendor_created IS 'Optimiza dashboard de cotizaciones recientes por vendedor';
COMMENT ON INDEX idx_clients_created_by IS 'Optimiza filtros de clientes por vendedor';
COMMENT ON INDEX idx_events_dates IS 'Optimiza búsquedas de eventos por rango de fechas (calendario)';
COMMENT ON INDEX idx_partial_payments_quote_id IS 'Optimiza cálculo de pagos totales por cotización';
COMMENT ON INDEX idx_profiles_role IS 'Optimiza verificación de roles (checkAdmin)';

-- ============================================================================
-- Notas
-- ============================================================================
-- Estos índices mejoran significativamente el rendimiento de:
-- - Dashboard principal (cotizaciones, estadísticas)
-- - Listas de cotizaciones filtradas
-- - Calendario de eventos
-- - Reportes financieros
-- - Verificación de roles (checkAdmin)
--
-- Los índices usan WHERE clauses para ser más eficientes y ocupar menos espacio
-- ============================================================================

