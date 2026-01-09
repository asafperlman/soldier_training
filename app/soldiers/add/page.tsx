import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { AddSoldiersForm } from '@/components/Forms/AddSoldiersForm'

export default async function AddSoldiersPage() {
  // Only department and class roles can add soldiers
  const profile = await requireRole(['department', 'class'])

  const supabase = await createClient()

  // Fetch departments and classes based on user scope
  let departmentsQuery = supabase.from('departments').select('*')
  let classesQuery = supabase.from('classes').select('*')

  if (profile.role === 'department' && profile.department_id) {
    departmentsQuery = departmentsQuery.eq('id', profile.department_id)
    classesQuery = classesQuery.eq('department_id', profile.department_id)
  } else if (profile.role === 'class' && profile.class_id) {
    // Get the class and its department
    const { data: classData } = await supabase
      .from('classes')
      .select('*, departments(*)')
      .eq('id', profile.class_id)
      .single()

    if (classData) {
      departmentsQuery = supabase
        .from('departments')
        .select('*')
        .eq('id', (classData as any).department_id)

      classesQuery = supabase
        .from('classes')
        .select('*')
        .eq('id', profile.class_id)
    }
  }

  const { data: departments } = await departmentsQuery
  const { data: classes } = await classesQuery

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">הוספת חיילים</h1>
      <AddSoldiersForm
        departments={departments || []}
        classes={classes || []}
        defaultDepartmentId={
          profile.role === 'department' ? profile.department_id || undefined : undefined
        }
        defaultClassId={profile.role === 'class' ? profile.class_id || undefined : undefined}
      />
    </div>
  )
}
