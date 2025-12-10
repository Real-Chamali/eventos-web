-- ==========================================================================
-- Rollback for migration 002_create_quote_versions_table
-- This script attempts to remove created policies, triggers, functions
-- and the `quote_versions` table in a safe/idempotent way.
-- Use with caution (will DROP objects). Recommended to run in staging first.
-- ==========================================================================

-- Drop policies if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quote_versions' AND policyname = 'quote_versions_user_select') THEN
    EXECUTE 'DROP POLICY quote_versions_user_select ON quote_versions';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quote_versions' AND policyname = 'quote_versions_user_insert') THEN
    EXECUTE 'DROP POLICY quote_versions_user_insert ON quote_versions';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quote_versions' AND policyname = 'quote_versions_admin_select') THEN
    EXECUTE 'DROP POLICY quote_versions_admin_select ON quote_versions';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quote_versions' AND policyname = 'quote_versions_admin_insert') THEN
    EXECUTE 'DROP POLICY quote_versions_admin_insert ON quote_versions';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quote_versions' AND policyname = 'quote_versions_no_delete') THEN
    EXECUTE 'DROP POLICY quote_versions_no_delete ON quote_versions';
  END IF;
END;
$$;

-- Drop triggers if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_create_initial_quote_version') THEN
    EXECUTE 'DROP TRIGGER trigger_create_initial_quote_version ON quotes';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_create_quote_version_on_update') THEN
    EXECUTE 'DROP TRIGGER trigger_create_quote_version_on_update ON quotes';
  END IF;
END;
$$;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS create_initial_quote_version() CASCADE;
DROP FUNCTION IF EXISTS create_quote_version_on_update() CASCADE;
DROP FUNCTION IF EXISTS get_quote_history(UUID) CASCADE;
DROP FUNCTION IF EXISTS compare_quote_versions(UUID, INT, INT) CASCADE;

-- Finally drop the table
DROP TABLE IF EXISTS quote_versions CASCADE;

-- End of rollback
