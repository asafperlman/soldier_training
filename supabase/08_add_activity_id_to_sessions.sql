-- =============================================================================
-- ADD ACTIVITY_ID TO TRAINING SESSIONS
-- =============================================================================
-- This migration adds activity_id to training_sessions table to support
-- company-specific activities instead of global training types
-- Run this in Supabase SQL Editor after 07_company_activities.sql

-- Add activity_id column (nullable for backward compatibility with existing data)
ALTER TABLE training_sessions
ADD COLUMN IF NOT EXISTS activity_id UUID REFERENCES company_activities(id) ON DELETE RESTRICT;

-- Add index for activity_id lookups
CREATE INDEX IF NOT EXISTS idx_training_sessions_activity_id ON training_sessions(activity_id);

-- Add composite index for common query pattern (activity + soldier + date)
CREATE INDEX IF NOT EXISTS idx_training_sessions_activity_soldier_date
  ON training_sessions(activity_id, soldier_id, session_date);

-- Update existing constraint check if needed
-- Note: We keep training_type_id for backward compatibility
-- New records should use activity_id, old records use training_type_id
-- In the future, training_type_id can be deprecated once all data is migrated

-- Comments
COMMENT ON COLUMN training_sessions.activity_id IS 'Reference to company-specific activity (replaces training_type_id for new records)';
