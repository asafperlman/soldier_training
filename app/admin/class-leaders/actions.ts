'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function createClassLeader(formData: FormData) {
  const supabase = await createClient()
  const profile = await getUserProfile()

  if (!profile || profile.role !== 'department') {
    return { error: 'אין הרשאה לבצע פעולה זו' }
  }

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const classId = formData.get('classId') as string

  // Validation
  if (!email || !password || !classId) {
    return { error: 'נא למלא את כל השדות' }
  }

  // Verify class belongs to department
  const { data: classData } = await supabase
    .from('classes')
    .select('department_id')
    .eq('id', classId)
    .single()

  if (!classData || classData.department_id !== profile.department_id) {
    return { error: 'הכיתה לא שייכת למחלקה שלך' }
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return { error: authError?.message || 'שגיאה ביצירת משתמש' }
  }

  // Create user profile
  const { error: profileError } = await supabase.from('user_profiles').insert({
    user_id: authData.user.id,
    role: 'class',
    magama_id: null,
    company_id: null,
    department_id: profile.department_id,
    class_id: classId,
  })

  if (profileError) {
    // Rollback: delete auth user
    await supabase.auth.admin.deleteUser(authData.user.id)
    return { error: 'שגיאה ביצירת פרופיל: ' + profileError.message }
  }

  revalidatePath('/admin/class-leaders')
  return { success: true, userId: authData.user.id }
}

export async function deleteClassLeader(userId: string) {
  const supabase = await createClient()
  const profile = await getUserProfile()

  if (!profile || profile.role !== 'department') {
    return { error: 'אין הרשאה לבצע פעולה זו' }
  }

  // Verify user belongs to department
  const { data: userData } = await supabase
    .from('user_profiles')
    .select('department_id, role')
    .eq('user_id', userId)
    .single()

  if (!userData || userData.department_id !== profile.department_id || userData.role !== 'class') {
    return { error: 'המשתמש לא נמצא או אינו שייך למחלקה שלך' }
  }

  // Delete user profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .delete()
    .eq('user_id', userId)

  if (profileError) {
    return { error: 'שגיאה במחיקת פרופיל: ' + profileError.message }
  }

  // Delete auth user
  const { error: authError } = await supabase.auth.admin.deleteUser(userId)

  if (authError) {
    return { error: 'שגיאה במחיקת משתמש: ' + authError.message }
  }

  revalidatePath('/admin/class-leaders')
  return { success: true }
}
