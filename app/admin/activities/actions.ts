'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ActivityData {
  name_he: string
  icon?: string | null
  required_time_seconds: number
}

/**
 * Create a new activity for the company
 * Only accessible to מ״פ (company commanders) and system_admin
 */
export async function createActivity(formData: FormData) {
  const supabase = await createClient()

  // Step 1: Verify caller is מ״פ or system_admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'לא מאומת' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role, company_id')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'פרופיל משתמש לא נמצא' }
  }

  if (profile.role !== 'company' && profile.role !== 'system_admin') {
    return { error: 'רק מפקד פלוגה (מ״פ) יכול לנהל פעילויות' }
  }

  if (profile.role === 'company' && !profile.company_id) {
    return { error: 'לא נמצא מזהה פלוגה' }
  }

  // Step 2: Validate input
  const name_he = formData.get('name_he') as string
  const icon = formData.get('icon') as string | null
  const required_time_seconds = parseInt(formData.get('required_time_seconds') as string)
  const company_id = formData.get('company_id') as string || profile.company_id

  if (!name_he || name_he.trim().length === 0) {
    return { error: 'שם הפעילות חובה' }
  }

  if (isNaN(required_time_seconds) || required_time_seconds < 1 || required_time_seconds > 300) {
    return { error: 'זמן נדרש חייב להיות בין 1 ל-300 שניות' }
  }

  // For company role, enforce they can only create for their company
  if (profile.role === 'company' && company_id !== profile.company_id) {
    return { error: 'אין הרשאה ליצור פעילות לפלוגה אחרת' }
  }

  // Step 3: Check for duplicate name within company
  const { data: existing } = await supabase
    .from('company_activities')
    .select('id')
    .eq('company_id', company_id!)
    .eq('name_he', name_he.trim())
    .single()

  if (existing) {
    return { error: 'פעילות עם שם זה כבר קיימת בפלוגה' }
  }

  // Step 4: Insert activity
  const { error: insertError } = await supabase.from('company_activities').insert({
    company_id: company_id!,
    name_he: name_he.trim(),
    icon: icon && icon.trim().length > 0 ? icon.trim() : null,
    required_time_seconds,
    is_active: true,
  })

  if (insertError) {
    return { error: `שגיאה ביצירת פעילות: ${insertError.message}` }
  }

  revalidatePath('/admin/activities')
  return { success: true }
}

/**
 * Update an existing activity
 * Only accessible to מ״פ (company commanders) and system_admin
 */
export async function updateActivity(id: string, formData: FormData) {
  const supabase = await createClient()

  // Step 1: Verify caller
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'לא מאומת' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role, company_id')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'פרופיל משתמש לא נמצא' }
  }

  if (profile.role !== 'company' && profile.role !== 'system_admin') {
    return { error: 'רק מפקד פלוגה (מ״פ) יכול לעדכן פעילויות' }
  }

  // Step 2: Verify activity belongs to user's company
  const { data: activity, error: activityError } = await supabase
    .from('company_activities')
    .select('company_id')
    .eq('id', id)
    .single()

  if (activityError || !activity) {
    return { error: 'פעילות לא נמצאה' }
  }

  if (profile.role === 'company' && activity.company_id !== profile.company_id) {
    return { error: 'אין הרשאה לעדכן פעילות של פלוגה אחרת' }
  }

  // Step 3: Validate input
  const name_he = formData.get('name_he') as string
  const icon = formData.get('icon') as string | null
  const required_time_seconds = parseInt(formData.get('required_time_seconds') as string)

  if (!name_he || name_he.trim().length === 0) {
    return { error: 'שם הפעילות חובה' }
  }

  if (isNaN(required_time_seconds) || required_time_seconds < 1 || required_time_seconds > 300) {
    return { error: 'זמן נדרש חייב להיות בין 1 ל-300 שניות' }
  }

  // Check for duplicate name (excluding current activity)
  const { data: existing } = await supabase
    .from('company_activities')
    .select('id')
    .eq('company_id', activity.company_id)
    .eq('name_he', name_he.trim())
    .neq('id', id)
    .single()

  if (existing) {
    return { error: 'פעילות עם שם זה כבר קיימת בפלוגה' }
  }

  // Step 4: Update activity
  const { error: updateError } = await supabase
    .from('company_activities')
    .update({
      name_he: name_he.trim(),
      icon: icon && icon.trim().length > 0 ? icon.trim() : null,
      required_time_seconds,
    })
    .eq('id', id)

  if (updateError) {
    return { error: `שגיאה בעדכון פעילות: ${updateError.message}` }
  }

  revalidatePath('/admin/activities')
  return { success: true }
}

/**
 * Toggle activity active/inactive status (soft delete)
 * Only accessible to מ״פ and system_admin
 */
export async function toggleActivityStatus(id: string, isActive: boolean) {
  const supabase = await createClient()

  // Step 1: Verify caller
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'לא מאומת' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role, company_id')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'פרופיל משתמש לא נמצא' }
  }

  if (profile.role !== 'company' && profile.role !== 'system_admin') {
    return { error: 'רק מפקד פלוגה (מ״פ) יכול לשנות סטטוס פעילויות' }
  }

  // Step 2: Verify activity belongs to user's company
  const { data: activity, error: activityError } = await supabase
    .from('company_activities')
    .select('company_id')
    .eq('id', id)
    .single()

  if (activityError || !activity) {
    return { error: 'פעילות לא נמצאה' }
  }

  if (profile.role === 'company' && activity.company_id !== profile.company_id) {
    return { error: 'אין הרשאה לשנות סטטוס פעילות של פלוגה אחרת' }
  }

  // Step 3: Update status
  const { error: updateError } = await supabase
    .from('company_activities')
    .update({ is_active: isActive })
    .eq('id', id)

  if (updateError) {
    return { error: `שגיאה בשינוי סטטוס: ${updateError.message}` }
  }

  revalidatePath('/admin/activities')
  return { success: true }
}

/**
 * Delete activity (hard delete - only for system_admin)
 * Note: Soft delete via is_active is preferred
 */
export async function deleteActivity(id: string) {
  const supabase = await createClient()

  // Step 1: Verify caller is system_admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'לא מאומת' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'פרופיל משתמש לא נמצא' }
  }

  if (profile.role !== 'system_admin') {
    return { error: 'רק מנהל מערכת יכול למחוק פעילויות לצמיתות' }
  }

  // Step 2: Delete activity
  const { error: deleteError } = await supabase.from('company_activities').delete().eq('id', id)

  if (deleteError) {
    return { error: `שגיאה במחיקת פעילות: ${deleteError.message}` }
  }

  revalidatePath('/admin/activities')
  return { success: true }
}
