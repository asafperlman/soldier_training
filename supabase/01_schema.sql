-- =============================================================================
-- MILITARY TRAINING TRACKER - DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- ORGANIZATIONAL HIERARCHY TABLES
-- =============================================================================

-- Magamas (Brigade level)
CREATE TABLE IF NOT EXISTS magamas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  magama_id UUID NOT NULL REFERENCES magamas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(magama_id, name)
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Classes
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(department_id, name)
);

-- =============================================================================
-- SOLDIERS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS soldiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- TRAINING TYPES AND REQUIREMENTS
-- =============================================================================

-- Training Types (fixed for pilot - seeded data)
CREATE TABLE IF NOT EXISTS training_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL CHECK (unit IN ('seconds', 'boolean')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Requirements (pass/fail rules)
CREATE TABLE IF NOT EXISTS requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_type_id UUID NOT NULL REFERENCES training_types(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('max_seconds', 'must_be_true')),
  threshold_int INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(training_type_id)
);

-- =============================================================================
-- TRAINING SESSIONS AND ATTEMPTS
-- =============================================================================

-- Training Sessions
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_type_id UUID NOT NULL REFERENCES training_types(id) ON DELETE RESTRICT,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  magama_id UUID NOT NULL REFERENCES magamas(id) ON DELETE CASCADE,
  session_at TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Training Attempts (unlimited per soldier per session)
CREATE TABLE IF NOT EXISTS training_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  soldier_id UUID NOT NULL REFERENCES soldiers(id) ON DELETE CASCADE,
  attempt_no INT NOT NULL,
  value_seconds INT,
  value_bool BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, soldier_id, attempt_no),
  -- Ensure either value_seconds or value_bool is set (but not both)
  CHECK (
    (value_seconds IS NOT NULL AND value_bool IS NULL) OR
    (value_seconds IS NULL AND value_bool IS NOT NULL)
  )
);

-- =============================================================================
-- USER PROFILES (ROLE + SCOPE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('system_admin', 'company', 'department', 'class')),
  magama_id UUID REFERENCES magamas(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Constraints: ensure role-based scope makes sense
  CHECK (
    (role = 'system_admin' AND company_id IS NULL AND department_id IS NULL AND class_id IS NULL) OR
    (role = 'company' AND company_id IS NOT NULL AND department_id IS NULL AND class_id IS NULL) OR
    (role = 'department' AND department_id IS NOT NULL AND class_id IS NULL) OR
    (role = 'class' AND class_id IS NOT NULL)
  )
);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_soldiers_updated_at
  BEFORE UPDATE ON soldiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_sessions_updated_at
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
