import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    // Step 1: Verify caller is system_admin
    const callerClient = await createClient()
    const { data: { user: callerUser }, error: authError } = await callerClient.auth.getUser()

    if (authError || !callerUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check caller's role
    const { data: callerProfile, error: profileError } = await callerClient
      .from('user_profiles')
      .select('role')
      .eq('user_id', callerUser.id)
      .single()

    if (profileError || callerProfile?.role !== 'system_admin') {
      return NextResponse.json({ error: 'Forbidden: Only system_admin can create users' }, { status: 403 })
    }

    // Step 2: Parse request body
    const body = await request.json()
    const { email, password, role, companyId, departmentId } = body

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (role !== 'company' && role !== 'department') {
      return NextResponse.json({ error: 'Invalid role. Must be company or department' }, { status: 400 })
    }

    if (role === 'company' && !companyId) {
      return NextResponse.json({ error: 'companyId required for company role' }, { status: 400 })
    }

    if (role === 'department' && !departmentId) {
      return NextResponse.json({ error: 'departmentId required for department role' }, { status: 400 })
    }

    // Step 3: Create auth user using admin client
    const adminClient = createAdminClient()
    const { data: authData, error: createAuthError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role },
    })

    if (createAuthError || !authData.user) {
      return NextResponse.json({ error: createAuthError?.message || 'Failed to create auth user' }, { status: 500 })
    }

    // Step 4: Create user_profiles record
    const profileData: any = {
      user_id: authData.user.id,
      role,
      company_id: null,
      department_id: null,
      class_id: null,
      magama_id: null,
    }

    if (role === 'company') {
      profileData.company_id = companyId
    } else if (role === 'department') {
      profileData.department_id = departmentId
    }

    const { error: insertProfileError } = await adminClient
      .from('user_profiles')
      .insert(profileData)

    if (insertProfileError) {
      // Rollback: delete auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: insertProfileError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId: authData.user.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
