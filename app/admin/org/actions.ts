'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Magama actions
export async function createMagama(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string

  if (!name || name.trim().length === 0) {
    return { error: 'נא להזין שם מגמה' }
  }

  const { error } = await supabase.from('magamas').insert({ name: name.trim() })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/org')
  return { success: true }
}

export async function updateMagama(id: string, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string

  if (!name || name.trim().length === 0) {
    return { error: 'נא להזין שם מגמה' }
  }

  const { error } = await supabase.from('magamas').update({ name: name.trim() }).eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/org')
  return { success: true }
}

export async function deleteMagama(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('magamas').delete().eq('id', id)

  if (error) {
    return { error: 'לא ניתן למחוק מגמה עם פלוגות קיימות' }
  }

  revalidatePath('/admin/org')
  return { success: true }
}

// Company actions
export async function createCompany(formData: FormData) {
  const supabase = await createClient()

  const magamaId = formData.get('magamaId') as string
  const name = formData.get('name') as string

  if (!magamaId || !name || name.trim().length === 0) {
    return { error: 'נא להזין מגמה ושם פלוגה' }
  }

  const { error } = await supabase
    .from('companies')
    .insert({ magama_id: magamaId, name: name.trim() })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/org')
  return { success: true }
}

export async function updateCompany(id: string, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string

  if (!name || name.trim().length === 0) {
    return { error: 'נא להזין שם פלוגה' }
  }

  const { error } = await supabase.from('companies').update({ name: name.trim() }).eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/org')
  return { success: true }
}

export async function deleteCompany(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('companies').delete().eq('id', id)

  if (error) {
    return { error: 'לא ניתן למחוק פלוגה עם מחלקות קיימות' }
  }

  revalidatePath('/admin/org')
  return { success: true }
}

// Department actions
export async function createDepartment(formData: FormData) {
  const supabase = await createClient()

  const companyId = formData.get('companyId') as string
  const name = formData.get('name') as string

  if (!companyId || !name || name.trim().length === 0) {
    return { error: 'נא להזין פלוגה ושם מחלקה' }
  }

  const { error } = await supabase
    .from('departments')
    .insert({ company_id: companyId, name: name.trim() })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/org')
  return { success: true }
}

export async function updateDepartment(id: string, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string

  if (!name || name.trim().length === 0) {
    return { error: 'נא להזין שם מחלקה' }
  }

  const { error } = await supabase.from('departments').update({ name: name.trim() }).eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/org')
  return { success: true }
}

export async function deleteDepartment(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('departments').delete().eq('id', id)

  if (error) {
    return { error: 'לא ניתן למחוק מחלקה עם כיתות קיימות' }
  }

  revalidatePath('/admin/org')
  return { success: true }
}

// Class actions
export async function createClass(formData: FormData) {
  const supabase = await createClient()

  const departmentId = formData.get('departmentId') as string
  const name = formData.get('name') as string

  if (!departmentId || !name || name.trim().length === 0) {
    return { error: 'נא להזין מחלקה ושם כיתה' }
  }

  const { error } = await supabase
    .from('classes')
    .insert({ department_id: departmentId, name: name.trim() })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/org')
  return { success: true }
}

export async function updateClass(id: string, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string

  if (!name || name.trim().length === 0) {
    return { error: 'נא להזין שם כיתה' }
  }

  const { error } = await supabase.from('classes').update({ name: name.trim() }).eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/org')
  return { success: true }
}

export async function deleteClass(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('classes').delete().eq('id', id)

  if (error) {
    return { error: 'לא ניתן למחוק כיתה עם חיילים קיימים' }
  }

  revalidatePath('/admin/org')
  return { success: true }
}
