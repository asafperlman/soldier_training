-- =============================================================================
-- ROW LEVEL SECURITY - POLICIES
-- CRITICAL: These policies enforce role-based access control
-- =============================================================================

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================

ALTER TABLE magamas ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE soldiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- USER PROFILES POLICIES
-- =============================================================================

-- Users can view their own profile
CREATE POLICY "users_view_own_profile" ON user_profiles
  FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "admins_view_all_profiles" ON user_profiles
  FOR SELECT
  USING (auth.is_admin());

-- Admins can insert/update profiles (for user creation)
CREATE POLICY "admins_manage_profiles" ON user_profiles
  FOR INSERT
  WITH CHECK (auth.is_admin());

CREATE POLICY "admins_update_profiles" ON user_profiles
  FOR UPDATE
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Department commanders can view class leader profiles in their department
CREATE POLICY "dept_view_class_profiles" ON user_profiles
  FOR SELECT
  USING (
    auth.is_department()
    AND role = 'class'
    AND department_id = auth.user_department_id()
  );

-- Department commanders can insert class leader profiles
CREATE POLICY "dept_insert_class_profiles" ON user_profiles
  FOR INSERT
  WITH CHECK (
    auth.is_department()
    AND role = 'class'
    AND department_id = auth.user_department_id()
  );

-- =============================================================================
-- ORGANIZATIONAL HIERARCHY POLICIES
-- =============================================================================

-- Everyone authenticated can read org structure
CREATE POLICY "org_read_magamas" ON magamas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "org_read_companies" ON companies FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "org_read_departments" ON departments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "org_read_classes" ON classes FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins can manage org structure
CREATE POLICY "admin_manage_magamas" ON magamas
  FOR ALL
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "admin_manage_companies" ON companies
  FOR ALL
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "admin_manage_departments" ON departments
  FOR ALL
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "admin_manage_classes" ON classes
  FOR ALL
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- =============================================================================
-- SOLDIERS POLICIES
-- =============================================================================

-- Admins see all soldiers
CREATE POLICY "admin_soldiers_all" ON soldiers
  FOR ALL
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Company commanders see soldiers in their company
CREATE POLICY "company_soldiers_select" ON soldiers
  FOR SELECT
  USING (
    auth.is_company()
    AND company_id = auth.user_company_id()
  );

CREATE POLICY "company_soldiers_insert" ON soldiers
  FOR INSERT
  WITH CHECK (
    auth.is_company()
    AND company_id = auth.user_company_id()
  );

CREATE POLICY "company_soldiers_update" ON soldiers
  FOR UPDATE
  USING (
    auth.is_company()
    AND company_id = auth.user_company_id()
  )
  WITH CHECK (
    auth.is_company()
    AND company_id = auth.user_company_id()
  );

-- Department commanders see soldiers in their department
CREATE POLICY "dept_soldiers_select" ON soldiers
  FOR SELECT
  USING (
    auth.is_department()
    AND department_id = auth.user_department_id()
  );

CREATE POLICY "dept_soldiers_insert" ON soldiers
  FOR INSERT
  WITH CHECK (
    auth.is_department()
    AND department_id = auth.user_department_id()
  );

CREATE POLICY "dept_soldiers_update" ON soldiers
  FOR UPDATE
  USING (
    auth.is_department()
    AND department_id = auth.user_department_id()
  )
  WITH CHECK (
    auth.is_department()
    AND department_id = auth.user_department_id()
  );

-- Class leaders see soldiers in their class
CREATE POLICY "class_soldiers_select" ON soldiers
  FOR SELECT
  USING (
    auth.is_class()
    AND class_id = auth.user_class_id()
  );

CREATE POLICY "class_soldiers_insert" ON soldiers
  FOR INSERT
  WITH CHECK (
    auth.is_class()
    AND class_id = auth.user_class_id()
  );

-- =============================================================================
-- TRAINING TYPES AND REQUIREMENTS POLICIES
-- =============================================================================

-- Everyone can read training types and requirements (seed data)
CREATE POLICY "training_types_read" ON training_types
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "requirements_read" ON requirements
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can modify (should not be needed after seeding)
CREATE POLICY "admin_training_types" ON training_types
  FOR ALL
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "admin_requirements" ON requirements
  FOR ALL
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- =============================================================================
-- TRAINING SESSIONS POLICIES
-- =============================================================================

-- Admins see all sessions
CREATE POLICY "admin_sessions_all" ON training_sessions
  FOR ALL
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Company commanders see sessions in their company
CREATE POLICY "company_sessions_select" ON training_sessions
  FOR SELECT
  USING (
    auth.is_company()
    AND company_id = auth.user_company_id()
  );

CREATE POLICY "company_sessions_insert" ON training_sessions
  FOR INSERT
  WITH CHECK (
    auth.is_company()
    AND company_id = auth.user_company_id()
    AND created_by = auth.uid()
  );

-- Department commanders see sessions in their department
CREATE POLICY "dept_sessions_select" ON training_sessions
  FOR SELECT
  USING (
    auth.is_department()
    AND department_id = auth.user_department_id()
  );

CREATE POLICY "dept_sessions_insert" ON training_sessions
  FOR INSERT
  WITH CHECK (
    auth.is_department()
    AND department_id = auth.user_department_id()
    AND created_by = auth.uid()
  );

-- Class leaders see sessions for their class
CREATE POLICY "class_sessions_select" ON training_sessions
  FOR SELECT
  USING (
    auth.is_class()
    AND class_id = auth.user_class_id()
  );

CREATE POLICY "class_sessions_insert" ON training_sessions
  FOR INSERT
  WITH CHECK (
    auth.is_class()
    AND class_id = auth.user_class_id()
    AND created_by = auth.uid()
  );

-- =============================================================================
-- TRAINING ATTEMPTS POLICIES
-- =============================================================================

-- Attempts inherit access from sessions (users can only access attempts for sessions they can see)
CREATE POLICY "attempts_via_session" ON training_attempts
  FOR SELECT
  USING (
    session_id IN (SELECT id FROM training_sessions)
  );

CREATE POLICY "attempts_insert_via_session" ON training_attempts
  FOR INSERT
  WITH CHECK (
    session_id IN (SELECT id FROM training_sessions)
  );

-- Only allow updates/deletes by session creator (if needed)
CREATE POLICY "attempts_update_by_creator" ON training_attempts
  FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM training_sessions WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM training_sessions WHERE created_by = auth.uid()
    )
  );
