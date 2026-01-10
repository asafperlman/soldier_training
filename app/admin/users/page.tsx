import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Common'
import { CreateUserForm } from '@/components/Admin/CreateUserForm'
import { ROLE_LABELS } from '@/lib/constants'

export default async function AdminUsersPage() {
  await requireRole(['system_admin'])

  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Fetch companies and departments for the form
  const [{ data: companies }, { data: departments }] = await Promise.all([
    supabase.from('companies').select('id, name, magamas(name)').order('name'),
    supabase.from('departments').select('id, name, companies(name)').order('name'),
  ])

  // Fetch existing MP/MM users
  const { data: users } = await supabase
    .from('user_profiles')
    .select(`
      user_id,
      role,
      company_id,
      department_id,
      companies(name),
      departments(name),
      created_at
    `)
    .in('role', ['company', 'department'])
    .order('created_at', { ascending: false })

  // Get email addresses for users using admin client
  const usersWithEmails = users
    ? await Promise.all(
        users.map(async (user) => {
          const { data: authUser } = await adminClient.auth.admin.getUserById(user.user_id)
          return {
            ...user,
            email: authUser?.user?.email || 'לא ידוע',
          }
        })
      )
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">ניהול משתמשים</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          יצירת משתמשים חדשים בתפקידי מ״פ (Company) ומ״מ (Department)
        </p>
      </div>

      {/* Create User Form */}
      <Card>
        <CardHeader>
          <CardTitle>יצירת משתמש חדש</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateUserForm companies={companies || []} departments={departments || []} />
        </CardContent>
      </Card>

      {/* Existing Users List */}
      <Card>
        <CardHeader>
          <CardTitle>משתמשים קיימים ({usersWithEmails.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {usersWithEmails.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>אין משתמשים. צור משתמש ראשון למעלה.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-start py-3 px-4 font-medium">דוא״ל</th>
                    <th className="text-start py-3 px-4 font-medium">תפקיד</th>
                    <th className="text-start py-3 px-4 font-medium">היקף</th>
                    <th className="text-start py-3 px-4 font-medium">נוצר</th>
                  </tr>
                </thead>
                <tbody>
                  {usersWithEmails.map((user) => (
                    <tr key={user.user_id} className="border-b border-border">
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {ROLE_LABELS[user.role]}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {user.role === 'company' && (user as any).companies?.name}
                        {user.role === 'department' && (user as any).departments?.name}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(user.created_at!).toLocaleDateString('he-IL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
