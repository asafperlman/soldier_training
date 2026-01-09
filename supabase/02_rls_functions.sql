-- =============================================================================
-- ROW LEVEL SECURITY - HELPER FUNCTIONS
-- These security definer functions improve RLS performance significantly
-- =============================================================================

-- Get user role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM user_profiles WHERE user_id = auth.uid();
$$;

-- Get user's complete scope
CREATE OR REPLACE FUNCTION auth.user_scope()
RETURNS TABLE (
  role TEXT,
  magama_id UUID,
  company_id UUID,
  department_id UUID,
  class_id UUID
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role, magama_id, company_id, department_id, class_id
  FROM user_profiles
  WHERE user_id = auth.uid();
$$;

-- Check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'system_admin'
  );
$$;

-- Check if user is company commander
CREATE OR REPLACE FUNCTION auth.is_company()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'company'
  );
$$;

-- Check if user is department commander
CREATE OR REPLACE FUNCTION auth.is_department()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'department'
  );
$$;

-- Check if user is class leader
CREATE OR REPLACE FUNCTION auth.is_class()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'class'
  );
$$;

-- Get user's company_id
CREATE OR REPLACE FUNCTION auth.user_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM user_profiles WHERE user_id = auth.uid();
$$;

-- Get user's department_id
CREATE OR REPLACE FUNCTION auth.user_department_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT department_id FROM user_profiles WHERE user_id = auth.uid();
$$;

-- Get user's class_id
CREATE OR REPLACE FUNCTION auth.user_class_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT class_id FROM user_profiles WHERE user_id = auth.uid();
$$;
