import { requireAuth, requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { DataEntryForm } from '@/components/Forms/DataEntryForm'

export default async function DataEntryPage() {
  // Only company, department, and class roles can enter data
  const profile = await requireRole(['company', 'department', 'class'])

  const supabase = await createClient()

  // Fetch training types with requirements
  const { data: trainingTypes } = await supabase
    .from('training_types')
    .select('*, requirements(*)')

  // Fetch classes based on user scope
  let classesQuery = supabase.from('classes').select('*')

  if (profile.role === 'company' && profile.company_id) {
    // Get all departments in company, then classes
    const { data: depts } = await supabase
      .from('departments')
      .select('id')
      .eq('company_id', profile.company_id)

    if (depts) {
      const deptIds = depts.map((d) => d.id)
      classesQuery = classesQuery.in('department_id', deptIds)
    }
  } else if (profile.role === 'department' && profile.department_id) {
    classesQuery = classesQuery.eq('department_id', profile.department_id)
  } else if (profile.role === 'class' && profile.class_id) {
    classesQuery = classesQuery.eq('id', profile.class_id)
  }

  const { data: classes } = await classesQuery

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">הזנת נתונים</h1>
      <DataEntryForm
        trainingTypes={trainingTypes || []}
        classes={classes || []}
        defaultClassId={profile.role === 'class' ? profile.class_id || undefined : undefined}
      />
    </div>
  )
}
