-- =============================================================================
-- PERFORMANCE INDEXES
-- CRITICAL: These indexes dramatically improve RLS query performance
-- Indexes on ALL columns used in RLS policies are essential
-- =============================================================================

-- =============================================================================
-- SOLDIERS INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_soldiers_class
  ON soldiers(class_id);

CREATE INDEX IF NOT EXISTS idx_soldiers_dept
  ON soldiers(department_id);

CREATE INDEX IF NOT EXISTS idx_soldiers_company
  ON soldiers(company_id);

CREATE INDEX IF NOT EXISTS idx_soldiers_status
  ON soldiers(status);

CREATE INDEX IF NOT EXISTS idx_soldiers_class_status
  ON soldiers(class_id, status);

-- =============================================================================
-- TRAINING SESSIONS INDEXES
-- =============================================================================

-- Primary lookup patterns: by class, department, company + training type + date
CREATE INDEX IF NOT EXISTS idx_session_class_type_date
  ON training_sessions(class_id, training_type_id, session_at DESC);

CREATE INDEX IF NOT EXISTS idx_session_dept_type_date
  ON training_sessions(department_id, training_type_id, session_at DESC);

CREATE INDEX IF NOT EXISTS idx_session_company_type_date
  ON training_sessions(company_id, training_type_id, session_at DESC);

CREATE INDEX IF NOT EXISTS idx_session_magama_type_date
  ON training_sessions(magama_id, training_type_id, session_at DESC);

-- Lookup by creator
CREATE INDEX IF NOT EXISTS idx_session_created_by
  ON training_sessions(created_by);

-- Fast date range queries
CREATE INDEX IF NOT EXISTS idx_session_date
  ON training_sessions(session_at DESC);

-- =============================================================================
-- TRAINING ATTEMPTS INDEXES
-- =============================================================================

-- Primary lookup: by session
CREATE INDEX IF NOT EXISTS idx_attempt_session
  ON training_attempts(session_id);

-- Lookup by soldier (for history)
CREATE INDEX IF NOT EXISTS idx_attempt_soldier
  ON training_attempts(soldier_id);

-- Soldier history with date ordering
CREATE INDEX IF NOT EXISTS idx_attempt_soldier_date
  ON training_attempts(soldier_id, created_at DESC);

-- Fast best-time queries (for seconds trainings)
CREATE INDEX IF NOT EXISTS idx_attempt_session_soldier
  ON training_attempts(session_id, soldier_id, value_seconds);

-- =============================================================================
-- USER PROFILES INDEXES
-- =============================================================================

-- Primary lookup: by role
CREATE INDEX IF NOT EXISTS idx_profile_role
  ON user_profiles(role);

-- Scope-based lookups
CREATE INDEX IF NOT EXISTS idx_profile_company
  ON user_profiles(company_id)
  WHERE company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profile_dept
  ON user_profiles(department_id)
  WHERE department_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profile_class
  ON user_profiles(class_id)
  WHERE class_id IS NOT NULL;

-- =============================================================================
-- ORGANIZATIONAL HIERARCHY INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_companies_magama
  ON companies(magama_id);

CREATE INDEX IF NOT EXISTS idx_departments_company
  ON departments(company_id);

CREATE INDEX IF NOT EXISTS idx_classes_department
  ON classes(department_id);

-- =============================================================================
-- TRAINING TYPES AND REQUIREMENTS INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_requirements_training_type
  ON requirements(training_type_id);

-- =============================================================================
-- FULL-TEXT SEARCH INDEXES (for soldier names)
-- =============================================================================

-- Enable pg_trgm extension for fuzzy search (if needed in future)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram index for soldier name search (if needed)
-- CREATE INDEX IF NOT EXISTS idx_soldiers_name_trgm
--   ON soldiers USING gin (full_name gin_trgm_ops);
