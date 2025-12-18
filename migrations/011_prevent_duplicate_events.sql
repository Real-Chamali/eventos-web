-- Migración para prevenir eventos duplicados y solapamientos de fechas
-- Fecha: 2025-01-XX
-- Descripción: Agrega validación a nivel de base de datos para prevenir eventos duplicados

-- 1. Agregar columnas start_date y end_date si no existen (por compatibilidad)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE events ADD COLUMN start_date TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE events ADD COLUMN end_date TIMESTAMPTZ;
  END IF;
END $$;

-- 2. Función para prevenir eventos duplicados y solapamientos
CREATE OR REPLACE FUNCTION prevent_overlapping_events()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar que start_date no sea null
  IF NEW.start_date IS NULL THEN
    RAISE EXCEPTION 'start_date no puede ser null';
  END IF;
  
  -- Si end_date es null, usar start_date como end_date
  DECLARE
    event_start TIMESTAMPTZ := NEW.start_date;
    event_end TIMESTAMPTZ := COALESCE(NEW.end_date, NEW.start_date);
  BEGIN
    -- Verificar solapamientos con otros eventos de la misma cotización
    IF EXISTS (
      SELECT 1 FROM events
      WHERE quote_id = NEW.quote_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND (
        -- El nuevo evento empieza dentro de un evento existente
        (event_start BETWEEN start_date AND COALESCE(end_date, start_date))
        -- El nuevo evento termina dentro de un evento existente
        OR (event_end BETWEEN start_date AND COALESCE(end_date, start_date))
        -- El nuevo evento contiene completamente un evento existente
        OR (start_date BETWEEN event_start AND event_end)
      )
    ) THEN
      RAISE EXCEPTION 'Ya existe un evento para esta cotización en estas fechas. Las fechas se solapan con un evento existente.';
    END IF;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear trigger para validar antes de insertar o actualizar
DROP TRIGGER IF EXISTS check_overlapping_events ON events;
CREATE TRIGGER check_overlapping_events
BEFORE INSERT OR UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION prevent_overlapping_events();

-- 4. Índice único para prevenir eventos duplicados exactos (misma cotización y misma fecha de inicio)
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_unique_quote_start_date 
ON events(quote_id, start_date)
WHERE start_date IS NOT NULL;

-- 5. Índice para mejorar rendimiento de consultas de solapamiento
CREATE INDEX IF NOT EXISTS idx_events_quote_dates 
ON events(quote_id, start_date, end_date)
WHERE start_date IS NOT NULL;

-- Comentarios
COMMENT ON FUNCTION prevent_overlapping_events() IS 'Previene la creación de eventos duplicados o con fechas solapadas para la misma cotización';
COMMENT ON INDEX idx_events_unique_quote_start_date IS 'Índice único para prevenir eventos duplicados exactos (misma cotización y fecha de inicio)';
COMMENT ON INDEX idx_events_quote_dates IS 'Índice para mejorar rendimiento de consultas de solapamiento de fechas';

