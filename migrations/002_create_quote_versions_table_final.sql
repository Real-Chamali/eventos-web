-- ==========================================================================
-- FINAL Migration (applied)
-- Source: migrations/002_create_quote_versions_table.sql (adapted for Supabase)
-- Applied on: 2025-12-10
-- Notes:
--  - Adapted to database schema (quotes.total_amount, enum values, vendor_id)
--  - Policies are created idempotently using DO blocks
--  - Triggers/functions use COALESCE(auth.uid(), NEW.vendor_id) as fallback
--  - `services` JSONB is ensured non-null via COALESCE(..., '[]'::jsonb)
-- ==========================================================================

-- Create quote_versions table to store historical data
CREATE TABLE IF NOT EXISTS quote_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL,
  version_number INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  client_id UUID NOT NULL,
  services JSONB NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_quote_versions_quote_id FOREIGN KEY (quote_id) 
    REFERENCES quotes(id) ON DELETE CASCADE,
  CONSTRAINT fk_quote_versions_client_id FOREIGN KEY (client_id) 
    REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_quote_versions_created_by FOREIGN KEY (created_by) 
    REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_quote_version UNIQUE(quote_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_quote_versions_quote_id 
  ON quote_versions(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_versions_created_at 
  ON quote_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_versions_created_by 
  ON quote_versions(created_by);
CREATE INDEX IF NOT EXISTS idx_quote_versions_status 
  ON quote_versions(status);
CREATE INDEX IF NOT EXISTS idx_quote_versions_composite 
  ON quote_versions(quote_id, version_number DESC);

ALTER TABLE quote_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies: created idempotently
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quote_versions' AND policyname = 'quote_versions_user_select'
  ) THEN
    CREATE POLICY quote_versions_user_select 
      ON quote_versions FOR SELECT 
      USING (
        auth.uid() IN (
          SELECT vendor_id FROM quotes WHERE id = quote_id
        ) 
        OR 
        EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quote_versions' AND policyname = 'quote_versions_user_insert'
  ) THEN
    CREATE POLICY quote_versions_user_insert 
      ON quote_versions FOR INSERT 
      WITH CHECK (
        auth.uid() IN (
          SELECT vendor_id FROM quotes WHERE id = quote_id
        ) 
        OR 
        EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quote_versions' AND policyname = 'quote_versions_admin_select'
  ) THEN
    CREATE POLICY quote_versions_admin_select 
      ON quote_versions FOR SELECT 
      USING (
        EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quote_versions' AND policyname = 'quote_versions_admin_insert'
  ) THEN
    CREATE POLICY quote_versions_admin_insert 
      ON quote_versions FOR INSERT 
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quote_versions' AND policyname = 'quote_versions_no_delete'
  ) THEN
    CREATE POLICY quote_versions_no_delete 
      ON quote_versions FOR DELETE 
      USING (false);
  END IF;
END;
$$;

-- Functions and triggers (idempotent via CREATE OR REPLACE / DO blocks)
CREATE OR REPLACE FUNCTION create_initial_quote_version()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO quote_versions (
    quote_id,
    version_number,
    status,
    total_price,
    client_id,
    services,
    notes,
    created_by,
    created_at
  ) VALUES (
    NEW.id,
    1,
    NEW.status,
    NEW.total_amount,
    NEW.client_id,
    (
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'service_id', qs.service_id,
              'quantity', qs.quantity,
              'final_price', qs.final_price
            )
          )
          FROM quote_services qs
          WHERE qs.quote_id = NEW.id
        ), '[]'::jsonb
      )
    ),
    NULL,
    COALESCE(auth.uid(), NEW.vendor_id),
    CURRENT_TIMESTAMP
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_create_initial_quote_version') THEN
    DROP TRIGGER trigger_create_initial_quote_version ON quotes;
  END IF;
END;
$$;

CREATE TRIGGER trigger_create_initial_quote_version
  AFTER INSERT ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_quote_version();

CREATE OR REPLACE FUNCTION create_quote_version_on_update()
RETURNS TRIGGER AS $$
DECLARE
  max_version INT;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) INTO max_version
  FROM quote_versions
  WHERE quote_id = NEW.id;
  
  IF OLD.status IS DISTINCT FROM NEW.status OR 
     OLD.total_amount IS DISTINCT FROM NEW.total_amount THEN
    INSERT INTO quote_versions (
      quote_id,
      version_number,
      status,
      total_price,
      client_id,
      services,
      notes,
      created_by,
      created_at
    ) VALUES (
      NEW.id,
      max_version + 1,
      NEW.status,
      NEW.total_amount,
      NEW.client_id,
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'service_id', qs.service_id,
              'quantity', qs.quantity,
              'final_price', qs.final_price
            )
          )
          FROM quote_services qs
          WHERE qs.quote_id = NEW.id
        ), '[]'::jsonb
      ),
      NULL,
      COALESCE(auth.uid(), NEW.vendor_id),
      CURRENT_TIMESTAMP
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_create_quote_version_on_update') THEN
    DROP TRIGGER trigger_create_quote_version_on_update ON quotes;
  END IF;
END;
$$;

CREATE TRIGGER trigger_create_quote_version_on_update
  AFTER UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION create_quote_version_on_update();

CREATE OR REPLACE FUNCTION get_quote_history(quote_uuid UUID)
RETURNS TABLE (
  version_number INT,
  status VARCHAR,
  total_price DECIMAL,
  services JSONB,
  created_by_name VARCHAR,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    qv.version_number,
    qv.status,
    qv.total_price,
    qv.services,
    p.full_name,
    qv.created_at
  FROM quote_versions qv
  LEFT JOIN profiles p ON p.id = qv.created_by
  WHERE qv.quote_id = quote_uuid
  ORDER BY qv.version_number DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION compare_quote_versions(
  quote_uuid UUID,
  v1 INT,
  v2 INT
)
RETURNS TABLE (
  field_name TEXT,
  version1_value TEXT,
  version2_value TEXT,
  changed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH v1_data AS (
    SELECT * FROM quote_versions WHERE quote_id = quote_uuid AND version_number = v1
  ),
  v2_data AS (
    SELECT * FROM quote_versions WHERE quote_id = quote_uuid AND version_number = v2
  )
  SELECT
    'status'::TEXT,
    (SELECT status FROM v1_data)::TEXT,
    (SELECT status FROM v2_data)::TEXT,
    (SELECT status FROM v1_data) IS DISTINCT FROM (SELECT status FROM v2_data)
  UNION ALL
  SELECT
    'total_price'::TEXT,
    (SELECT total_price::TEXT FROM v1_data),
    (SELECT total_price::TEXT FROM v2_data),
    (SELECT total_price FROM v1_data) IS DISTINCT FROM (SELECT total_price FROM v2_data)
  UNION ALL
  SELECT
    'services'::TEXT,
    (SELECT services::TEXT FROM v1_data),
    (SELECT services::TEXT FROM v2_data),
    (SELECT services FROM v1_data) IS DISTINCT FROM (SELECT services FROM v2_data)
  ORDER BY changed DESC, field_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- End of final migration
