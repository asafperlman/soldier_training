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
      return NextResponse.json({ error: 'Forbidden: Only department role can delete class leaders' }, { status: 403 })
    }

    const callerDepartmentId = callerProfile.department_id
    if (!callerDepartmentId) {
      return NextResponse.json({ error: 'Caller has no department assigned' }, { status: 400 })
    }

    // Step 2: Parse request body
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Step 3: Verify the user is a class leader in the caller's department
    const { data: targetProfile, error: targetError } = await callerClient
      .from('user_profiles')
      .select('role, department_id')
      .eq('user_id', userId)
      .single()

    if (targetError || !targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetProfile.role !== 'class') {
      return NextResponse.json({ error: 'User is not a class leader' }, { status: 400 })
    }

    if (targetProfile.department_id !== callerDepartmentId) {
      return NextResponse.json({ error: 'Class leader does not belong to your department' }, { status: 403 })
    }

    // Step 4: Delete user_profiles record and auth user using admin client
    const adminClient = createAdminClient()

    // Delete profile first
    const { error: deleteProfileError } = await adminClient
      .from('user_profiles')
      .delete()
      .eq('user_id', userId)

    if (deleteProfileError) {
      return NextResponse.json({ error: deleteProfileError.message }, { status: 500 })
    }

    // Delete auth user
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId)

    if (deleteAuthError) {
      return NextResponse.json({ error: deleteAuthError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
