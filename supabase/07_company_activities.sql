-- =============================================================================
-- COMPANY ACTIVITIES MANAGEMENT (מ״פ Configuration)
-- =============================================================================
-- This migration adds company-level activities with required time configuration
-- Run this in Supabase SQL Editor after 01_schema.sql

-- Company Activities Table
-- Scoped to company level - each מ״פ manages their company's activities
CREATE TABLE IF NOT EXISTS company_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name_he TEXT NOT NULL,
  icon TEXT, -- Optional icon name (e.g., 'heart-pulse', 'bandage')
  required_time_seconds INT NOT NULL CHECK (required_time_seconds >= 1 AND required_time_seconds <= 300),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, name_he) -- Activity names must be unique within a company
);

-- Index for company_id lookups
CREATE INDEX IF NOT EXISTS idx_company_activities_company_id ON company_activities(company_id);
CREATE INDEX IF NOT EXISTS idx_company_activities_active ON company_activities(is_active) WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER update_company_activities_updated_at
  BEFORE UPDATE ON company_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RLS POLICIES FOR COMPANY ACTIVITIES
-- =============================================================================

-- Enable RLS
ALTER TABLE company_activities ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can read activities in their scope
-- - system_admin: all activities
-- - company (מ״פ): only their company's activities
-- - department (מ״מ): activities from their company
-- - class (מכ״י): activities from their company
CREATE POLICY "users_read_company_activities" ON company_activities
  FOR SELECT
  TO authenticated
  USING (
    -- System admin sees all
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'system_admin'
    )
    OR
    -- Company commander sees their company
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'company'
      AND company_id = company_activities.company_id
    )
    OR
    -- Department commander sees their company's activities
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN departments d ON d.id = up.department_id
      WHERE up.user_id = auth.uid()
      AND up.role = 'department'
      AND d.company_id = company_activities.company_id
    )
    OR
    -- Class leader sees their company's activities
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN classes c ON c.id = up.class_id
      JOIN departments d ON d.id = c.department_id
      WHERE up.user_id = auth.uid()
      AND up.role = 'class'
      AND d.company_id = company_activities.company_id
    )
  );

-- INSERT: Only מ״פ for that company or system_admin
CREATE POLICY "company_commanders_create_activities" ON company_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- System admin can create for any company
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'system_admin'
    )
    OR
    -- Company commander can create for their company only
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'company'
      AND company_id = company_activities.company_id
    )
  );

-- UPDATE: Only מ״פ for that company or system_admin
CREATE POLICY "company_commanders_update_activities" ON company_activities
  FOR UPDATE
  TO authenticated
  USING (
    -- System admin can update any
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'system_admin'
    )
    OR
    -- Company commander can update their company's activities
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'company'
      AND company_id = company_activities.company_id
    )
  );

-- DELETE: Only system_admin (soft delete via is_active is preferred)
CREATE POLICY "admins_delete_activities" ON company_activities
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'system_admin'
    )
  );

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant usage on table to authenticated users
GRANT SELECT, INSERT, UPDATE ON company_activities TO authenticated;
GRANT DELETE ON company_activities TO authenticated; -- RLS will restrict

-- Comments
COMMENT ON TABLE company_activities IS 'Company-level activities managed by מ״פ (company commanders)';
COMMENT ON COLUMN company_activities.required_time_seconds IS 'Required completion time in seconds (1-300)';
COMMENT ON COLUMN company_activities.is_active IS 'Soft delete flag - disabled activities are hidden from selection';
