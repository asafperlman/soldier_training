'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createUser(formData: FormData) {
  // Step 1: Verify caller is system_admin
  const callerClient = await createClient()
  const { data: { user: callerUser }, error: authError } = await callerClient.auth.getUser()

  if (authError || !callerUser) {
    return { error: 'לא מאומת' }
  }

  const { data: callerProfile, error: profileError } = await callerClient
    .from('user_profiles')
    .select('role')
    .eq('user_id', callerUser.id)
    .single()

  if (profileError || callerProfile?.role !== 'system_admin') {
    return { error: 'רק מנהל מערכת יכול ליצור משתמשים' }
  }

  // Step 2: Validate input
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string
  const companyId = formData.get('companyId') as string | null
  const departmentId = formData.get('departmentId') as string | null

  if (!email || !password || !role) {
    return { error: 'נא למלא את כל השדות' }
  }

  if (role === 'company' && !companyId) {
    return { error: 'נא לבחור פלוגה עבור תפקיד מ״פ' }
  }

  if (role === 'department' && !departmentId) {
    return { error: 'נא לבחור מחלקה עבור תפקיד מ״מ' }
  }

  // Step 3: Create auth user using admin client with service role
  const adminClient = createAdminClient()
  const { data: authData, error: createAuthError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role },
  })

  if (createAuthError || !authData.user) {
    return { error: createAuthError?.message || 'שגיאה ביצירת משתמש' }
  }

  // Step 4: Create user profile
  const profileData: any = {
    user_id: authData.user.id,
    role,
    magama_id: null,
    company_id: null,
    department_id: null,
    class_id: null,
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
    // Rollback: delete auth user
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return { error: 'שגיאה ביצירת פרופיל משתמש: ' + insertProfileError.message }
  }

  revalidatePath('/admin/users')
  return { success: true, userId: authData.user.id }
}
