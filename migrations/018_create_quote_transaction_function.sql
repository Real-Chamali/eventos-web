-- ============================================================================
-- Migración 018: Función para crear cotización con servicios de forma atómica
-- ============================================================================
-- Esta migración crea una función RPC que permite crear una cotización
-- y sus servicios en una transacción atómica, evitando estados inconsistentes
-- ============================================================================

CREATE OR REPLACE FUNCTION create_quote_with_services(
  p_client_id UUID,
  p_vendor_id UUID,
  p_notes TEXT,
  p_status TEXT,
  p_total_amount NUMERIC,
  p_services JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_quote_id UUID;
  v_service JSONB;
BEGIN
  -- Validar que el cliente existe
  IF NOT EXISTS (SELECT 1 FROM clients WHERE id = p_client_id) THEN
    RAISE EXCEPTION 'Client not found: %', p_client_id;
  END IF;

  -- Validar que hay al menos un servicio
  IF jsonb_array_length(p_services) = 0 THEN
    RAISE EXCEPTION 'At least one service is required';
  END IF;

  -- Crear cotización
  INSERT INTO quotes (
    client_id,
    vendor_id,
    notes,
    status,
    total_amount
  ) VALUES (
    p_client_id,
    p_vendor_id,
    p_notes,
    p_status,
    p_total_amount
  )
  RETURNING id INTO v_quote_id;

  -- Insertar servicios
  FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
  LOOP
    -- Validar que el servicio existe
    IF NOT EXISTS (
      SELECT 1 FROM services 
      WHERE id = (v_service->>'service_id')::UUID
    ) THEN
      RAISE EXCEPTION 'Service not found: %', v_service->>'service_id';
    END IF;

    -- Insertar servicio de cotización
    INSERT INTO quote_services (
      quote_id,
      service_id,
      quantity,
      price
    ) VALUES (
      v_quote_id,
      (v_service->>'service_id')::UUID,
      COALESCE((v_service->>'quantity')::INTEGER, 1),
      (v_service->>'price')::NUMERIC
    );
  END LOOP;

  RETURN v_quote_id;
END;
$$;

-- Comentarios
COMMENT ON FUNCTION create_quote_with_services IS 'Crea una cotización con sus servicios de forma atómica. Retorna el ID de la cotización creada.';

