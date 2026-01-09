'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createUser(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string
  const companyId = formData.get('companyId') as string | null
  const departmentId = formData.get('departmentId') as string | null

  // Validation
  if (!email || !password || !role) {
    return { error: 'נא למלא את כל השדות' }
  }

  if (role === 'company' && !companyId) {
    return { error: 'נא לבחור פלוגה עבור תפקיד מ״פ' }
  }

  if (role === 'department' && !departmentId) {
    return { error: 'נא לבחור מחלקה עבור תפקיד מ״מ' }
  }

  // Create auth user (using admin API)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return { error: authError?.message || 'שגיאה ביצירת משתמש' }
  }

  // Create user profile
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

  const { error: profileError } = await supabase.from('user_profiles').insert(profileData)

  if (profileError) {
    // Rollback: delete auth user
    await supabase.auth.admin.deleteUser(authData.user.id)
    return { error: 'שגיאה ביצירת פרופיל משתמש: ' + profileError.message }
  }

  revalidatePath('/admin/users')
  return { success: true, userId: authData.user.id }
}
