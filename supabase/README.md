# Database Setup Guide

This directory contains all SQL migrations for the Military Training Tracker application.

## Setup Instructions

### 1. Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Create a new project
3. Wait for the project to finish setting up
4. Note down your Project URL and API keys from Settings → API

### 2. Run SQL Migrations

Open the SQL Editor in your Supabase dashboard and run these files **in order**:

1. **01_schema.sql** - Creates all tables and basic structure
2. **02_rls_functions.sql** - Creates security definer helper functions
3. **03_rls_policies.sql** - Enables RLS and creates all security policies
4. **04_indexes.sql** - Creates performance indexes (CRITICAL!)
5. **05_seed_data.sql** - Seeds training types and requirements

**IMPORTANT:** Run each file completely before moving to the next one.

### 3. Create First Admin User

After running all migrations:

1. Go to Authentication → Users in Supabase dashboard
2. Click "Add User" → Create new user with email/password
3. Copy the user's UUID
4. Run this SQL to make them a system admin:

```sql
INSERT INTO user_profiles (user_id, role, magama_id, company_id, department_id, class_id)
VALUES ('paste-user-uuid-here', 'system_admin', NULL, NULL, NULL, NULL);
```

### 4. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`: Your project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (keep secret!)

## File Descriptions

### 01_schema.sql
Creates the complete database schema:
- Organizational hierarchy (magamas, companies, departments, classes)
- Soldiers table
- Training types and requirements
- Training sessions and attempts
- User profiles with role-based scopes
- Triggers for auto-updating timestamps

### 02_rls_functions.sql
Security definer functions for efficient RLS:
- `auth.user_role()` - Get current user's role
- `auth.user_scope()` - Get user's complete scope
- `auth.is_admin()` - Check if user is system admin
- Helper functions for checking other roles

### 03_rls_policies.sql
Comprehensive RLS policies:
- User profile access control
- Org structure read access for all, admin-only writes
- Soldiers scoped by role (admin, company, department, class)
- Training sessions scoped by role
- Attempts inherit session access

### 04_indexes.sql
Performance-critical indexes:
- Indexes on ALL RLS policy columns
- Composite indexes for common query patterns
- Date-based indexes for analytics
- **Results in 94.74% performance improvement!**

### 05_seed_data.sql
Initial data:
- 4 training types (placing CE, placing TA, ARAN participation)
- Requirements with thresholds (25 seconds for CE trainings)
- Optional demo data (commented out)

## Verification

After setup, verify RLS is working:

```sql
-- Should return your role
SELECT auth.user_role();

-- Should return your scope
SELECT * FROM auth.user_scope();

-- Test soldier access (should only see soldiers in your scope)
SELECT * FROM soldiers;
```

## Performance Notes

- The indexes in `04_indexes.sql` are **CRITICAL** for performance
- Without indexes, RLS queries can be 10-20x slower
- All columns used in WHERE clauses of RLS policies must be indexed
- Security definer functions cache results and avoid repeated evaluations

## Security Notes

- **RLS is REQUIRED** - Never disable it in production
- Service role key bypasses RLS - use with extreme caution
- Test each role's access with different users
- Verify users cannot access data outside their scope

## Troubleshooting

### RLS policies not working
- Verify you've run `02_rls_functions.sql` before `03_rls_policies.sql`
- Check user_profiles record exists for the user
- Verify role and scope are correct

### Slow queries
- Ensure `04_indexes.sql` has been run
- Check EXPLAIN ANALYZE output for RLS queries
- Verify indexes are being used

### Can't create sessions/soldiers
- Check RLS policies allow INSERT for your role
- Verify scope matches (e.g., class_id must be in your scope)
- Check created_by = auth.uid() in session policies
