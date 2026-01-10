import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Common'
import { ClassLeadersManagement } from '@/components/Admin/ClassLeadersManagement'

export default async function ClassLeadersPage() {
  const profile = await requireRole(['department'])

  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Fetch classes in the department
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('department_id', profile.department_id!)
    .order('name')

  // Fetch existing class leaders in the department
  const { data: classLeaders } = await supabase
    .from('user_profiles')
    .select(`
      user_id,
      class_id,
      classes(name),
      created_at
    `)
    .eq('role', 'class')
    .eq('department_id', profile.department_id!)
    .order('created_at', { ascending: false })

  // Get email addresses using admin client and normalize classes data
  const leadersWithEmails = classLeaders
    ? await Promise.all(
        classLeaders.map(async (leader) => {
          const { data: authUser } = await adminClient.auth.admin.getUserById(leader.user_id)
          const classesData = leader.classes as any
          return {
            user_id: leader.user_id,
            class_id: leader.class_id,
            classes: Array.isArray(classesData) && classesData.length > 0
              ? { name: classesData[0].name }
              : null,
            email: authUser?.user?.email || 'לא ידוע',
            created_at: leader.created_at,
          }
        })
      )
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">ניהול מכ״יים</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          ניהול מכוני כיתה (מכ״י) למחלקה שלך
        </p>
      </div>

      <Card>
        <CardContent>
          <ClassLeadersManagement classes={classes || []} classLeaders={leadersWithEmails} />
        </CardContent>
      </Card>
    </div>
  )
}
