-- Migración para agregar campos adicionales a la tabla events
-- Permite más detalles en la creación de eventos

DO $$ 
BEGIN
  -- Agregar campo de ubicación
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'location'
  ) THEN
    ALTER TABLE events ADD COLUMN location TEXT;
  END IF;
  
  -- Agregar campo de número de invitados
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'guest_count'
  ) THEN
    ALTER TABLE events ADD COLUMN guest_count INTEGER;
  END IF;
  
  -- Agregar campo de tipo de evento
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'event_type'
  ) THEN
    ALTER TABLE events ADD COLUMN event_type TEXT;
  END IF;
  
  -- Agregar campo de contacto de emergencia
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'emergency_contact'
  ) THEN
    ALTER TABLE events ADD COLUMN emergency_contact TEXT;
  END IF;
  
  -- Agregar campo de teléfono de emergencia
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'emergency_phone'
  ) THEN
    ALTER TABLE events ADD COLUMN emergency_phone TEXT;
  END IF;
  
  -- Agregar campo de requisitos especiales
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'special_requirements'
  ) THEN
    ALTER TABLE events ADD COLUMN special_requirements TEXT;
  END IF;
  
  -- Agregar campo de notas adicionales
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'additional_notes'
  ) THEN
    ALTER TABLE events ADD COLUMN additional_notes TEXT;
  END IF;
  
  -- Agregar campo de hora de inicio
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE events ADD COLUMN start_time TIME;
  END IF;
  
  -- Agregar campo de hora de fin
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE events ADD COLUMN end_time TIME;
  END IF;
  
  -- Agregar comentario a la tabla
  COMMENT ON TABLE events IS 'Tabla de eventos con información detallada incluyendo ubicación, invitados, tipo de evento y contactos de emergencia';
END $$;


