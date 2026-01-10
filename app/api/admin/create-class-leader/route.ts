import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    // Step 1: Verify caller is department role (MM)
    const callerClient = await createClient()
    const { data: { user: callerUser }, error: authError } = await callerClient.auth.getUser()

    if (authError || !callerUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check caller's role and department
    const { data: callerProfile, error: profileError } = await callerClient
      .from('user_profiles')
      .select('role, department_id')
      .eq('user_id', callerUser.id)
      .single()

    if (profileError || callerProfile?.role !== 'department') {
      return NextResponse.json({ error: 'Forbidden: Only department role can create class leaders' }, { status: 403 })
    }

    const callerDepartmentId = callerProfile.department_id
    if (!callerDepartmentId) {
      return NextResponse.json({ error: 'Caller has no department assigned' }, { status: 400 })
    }

    // Step 2: Parse request body
    const body = await request.json()
    const { email, password, classId } = body

    if (!email || !password || !classId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Step 3: Verify the class belongs to the caller's department
    const { data: classData, error: classError } = await callerClient
      .from('classes')
      .select('department_id')
      .eq('id', classId)
      .single()

    if (classError || !classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    if (classData.department_id !== callerDepartmentId) {
      return NextResponse.json({ error: 'Class does not belong to your department' }, { status: 403 })
    }

    // Step 4: Create auth user using admin client
    const adminClient = createAdminClient()
    const { data: authData, error: createAuthError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'class' },
    })

    if (createAuthError || !authData.user) {
      return NextResponse.json({ error: createAuthError?.message || 'Failed to create auth user' }, { status: 500 })
    }

    // Step 5: Create user_profiles record
    const profileData = {
      user_id: authData.user.id,
      role: 'class',
      company_id: null,
      department_id: callerDepartmentId,
      class_id: classId,
      magama_id: null,
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
