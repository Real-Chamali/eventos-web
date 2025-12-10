-- Audit Logs Table Schema
-- This script creates the audit_logs table in Supabase PostgreSQL

-- ============================================================================
-- Create audit_logs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  -- Primary Key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User Information
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Action Information
  action VARCHAR(50) NOT NULL,
  -- Valid actions: CREATE, READ, UPDATE, DELETE
  -- Other actions: LOGIN, LOGOUT, EXPORT, REPORT

  table_name VARCHAR(100) NOT NULL,
  -- Table being audited: quotes, services, clients, etc.

  -- Change Data (JSON for flexibility)
  old_values JSONB,
  new_values JSONB,

  -- Request Information
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
  -- Can store: session_id, request_id, app_version, environment, etc.
);

-- ============================================================================
-- Create Indexes for Performance
-- ============================================================================

-- Index by user_id for quick user lookup
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);

-- Index by table_name for quick table lookup
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);

-- Index by action for quick action lookup
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- Index by created_at for time-range queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Composite index for common queries: (table_name, created_at DESC)
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_time ON public.audit_logs(table_name, created_at DESC);

-- Composite index for user audit trail: (user_id, created_at DESC)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time ON public.audit_logs(user_id, created_at DESC);

-- ============================================================================
-- Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy 1: Admin users can view all audit logs
CREATE POLICY audit_logs_admin_view ON public.audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy 2: Users can only view their own audit logs
CREATE POLICY audit_logs_user_view_own ON public.audit_logs
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy 3: Authenticated users can create audit logs
CREATE POLICY audit_logs_user_create ON public.audit_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 4: No direct deletes (preserve audit trail)
-- This is handled by NOT creating a DELETE policy

-- ============================================================================
-- Helper Function: Get audit trail for specific record
-- ============================================================================

CREATE OR REPLACE FUNCTION get_record_audit_trail(
  p_table_name VARCHAR,
  p_record_id uuid,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  action VARCHAR,
  table_name VARCHAR,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  user_email TEXT,
  user_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.user_id,
    al.action,
    al.table_name,
    al.old_values,
    al.new_values,
    al.ip_address,
    al.user_agent,
    al.created_at,
    u.email,
    p.name
  FROM audit_logs al
  LEFT JOIN auth.users u ON al.user_id = u.id
  LEFT JOIN public.profiles p ON al.user_id = p.user_id
  WHERE al.table_name = p_table_name
    AND (
      al.new_values->>'id' = p_record_id::TEXT
      OR al.old_values->>'id' = p_record_id::TEXT
    )
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Helper Function: Get user activity summary
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_activity(
  p_user_id uuid,
  p_days INT DEFAULT 7
)
RETURNS TABLE (
  action VARCHAR,
  table_name VARCHAR,
  count BIGINT,
  last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.action,
    al.table_name,
    COUNT(*) as count,
    MAX(al.created_at) as last_activity
  FROM audit_logs al
  WHERE al.user_id = p_user_id
    AND al.created_at > NOW() - INTERVAL '1 day' * p_days
  GROUP BY al.action, al.table_name
  ORDER BY MAX(al.created_at) DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE public.audit_logs IS 'Immutable audit log table for tracking all changes to data';
COMMENT ON COLUMN public.audit_logs.id IS 'Unique identifier for audit log entry';
COMMENT ON COLUMN public.audit_logs.user_id IS 'User who performed the action';
COMMENT ON COLUMN public.audit_logs.action IS 'Type of action: CREATE, READ, UPDATE, DELETE, etc.';
COMMENT ON COLUMN public.audit_logs.table_name IS 'Name of the table being modified';
COMMENT ON COLUMN public.audit_logs.old_values IS 'Previous values before the change (JSONB)';
COMMENT ON COLUMN public.audit_logs.new_values IS 'New values after the change (JSONB)';
COMMENT ON COLUMN public.audit_logs.ip_address IS 'IP address of the client making the request';
COMMENT ON COLUMN public.audit_logs.user_agent IS 'Browser/client user agent string';
COMMENT ON COLUMN public.audit_logs.created_at IS 'Timestamp when the action occurred';
COMMENT ON COLUMN public.audit_logs.metadata IS 'Additional metadata about the request (JSON)';

COMMENT ON FUNCTION get_record_audit_trail(VARCHAR, uuid, INT) IS 'Get full audit trail for a specific record';
COMMENT ON FUNCTION get_user_activity(uuid, INT) IS 'Get activity summary for a specific user';
