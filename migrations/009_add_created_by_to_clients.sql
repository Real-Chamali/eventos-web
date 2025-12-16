-- ============================================================================
-- Migración 009: Agregar columna created_by a la tabla clients
-- ============================================================================
-- Problema: Las políticas RLS de clients usan created_by pero la columna no existe
-- Solución: Agregar columna created_by y actualizar registros existentes
-- ============================================================================

-- Agregar columna created_by si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clients' 
    AND column_name = 'created_by'
  ) THEN
    -- Agregar columna created_by
    ALTER TABLE public.clients
    ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

    -- Crear índice para mejor rendimiento
    CREATE INDEX IF NOT EXISTS idx_clients_created_by ON public.clients(created_by);

    -- Actualizar registros existentes
    -- Si hay quotes asociadas, usar el vendor_id de la primera quote
    UPDATE public.clients c
    SET created_by = (
      SELECT q.vendor_id
      FROM public.quotes q
      WHERE q.client_id = c.id
      ORDER BY q.created_at ASC
      LIMIT 1
    )
    WHERE created_by IS NULL;

    -- Para clientes sin quotes, asignar a un admin si existe, o dejar NULL
    -- (Los admins pueden ver todos los clientes de todas formas)
    
    RAISE NOTICE '✅ Columna created_by agregada a clients';
  ELSE
    RAISE NOTICE 'ℹ️  Columna created_by ya existe en clients';
  END IF;
END $$;

-- ============================================================================
-- Comentarios
-- ============================================================================

COMMENT ON COLUMN public.clients.created_by IS 'Usuario que creó el cliente. Usado para RLS.';

-- ============================================================================
-- Verificación
-- ============================================================================

DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clients' 
    AND column_name = 'created_by'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE NOTICE '✅ Verificación: columna created_by existe en clients';
  ELSE
    RAISE WARNING '⚠️  Verificación: columna created_by NO existe en clients';
  END IF;
END $$;

