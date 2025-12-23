-- ============================================================================
-- Migración 021: Corregir función create_notification a SECURITY DEFINER
-- ============================================================================
-- Problema: La función en la migración 015 no tiene SECURITY DEFINER,
-- lo que impide que funcione correctamente con el service role.
-- ============================================================================

-- Corregir función create_notification para que sea SECURITY DEFINER
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER  -- ← Agregar esto para permitir ejecución con service role
SET search_path = public, pg_temp
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Validar tipo
  IF p_type NOT IN ('quote', 'event', 'payment', 'reminder', 'system') THEN
    RAISE EXCEPTION 'Invalid notification type: %', p_type;
  END IF;

  -- Insertar notificación
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_metadata)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Comentario para documentación
COMMENT ON FUNCTION create_notification(UUID, VARCHAR, VARCHAR, TEXT, JSONB) IS 
'Crea una notificación para un usuario. Usar con service role. Función SECURITY DEFINER para permitir ejecución con permisos elevados.';

