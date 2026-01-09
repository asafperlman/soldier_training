import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Common'
import Link from 'next/link'
import { Button } from '@/components/Common'

export default async function SoldiersListPage() {
  const profile = await requireRole(['company', 'department', 'class'])

  const supabase = await createClient()

  // Fetch soldiers based on user scope with class names
  let soldiersQuery = supabase
    .from('soldiers')
    .select(
      `
      id,
      full_name,
      status,
      class_id,
      classes!inner (
        id,
        name,
        department_id,
        departments!inner (
          id,
          name
        )
      )
    `
    )
    .order('full_name')

  if (profile.role === 'company' && profile.company_id) {
    soldiersQuery = soldiersQuery.eq('company_id', profile.company_id)
  } else if (profile.role === 'department' && profile.department_id) {
    soldiersQuery = soldiersQuery.eq('department_id', profile.department_id)
  } else if (profile.role === 'class' && profile.class_id) {
    soldiersQuery = soldiersQuery.eq('class_id', profile.class_id)
  }

  const { data: soldiers } = await soldiersQuery

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">רשימת חיילים</h1>
        {(profile.role === 'department' || profile.role === 'class') && (
          <Link href="/soldiers/add">
            <Button variant="primary">+ הוסף חיילים</Button>
          </Link>
        )}
      </div>

      <Card>
        <CardContent>
          {!soldiers || soldiers.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p className="text-lg mb-4">אין חיילים במערכת</p>
              {(profile.role === 'department' || profile.role === 'class') && (
                <Link href="/soldiers/add">
                  <Button variant="primary">הוסף חיילים</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-start py-3 px-4 font-medium">#</th>
                    <th className="text-start py-3 px-4 font-medium">שם מלא</th>
                    <th className="text-start py-3 px-4 font-medium">כיתה</th>
                    <th className="text-start py-3 px-4 font-medium">מחלקה</th>
                    <th className="text-center py-3 px-4 font-medium">סטטוס</th>
                  </tr>
                </thead>
                <tbody>
                  {soldiers.map((soldier, idx) => {
                    const classData = (soldier as any).classes
                    const deptData = classData?.departments

                    return (
                      <tr key={soldier.id} className="border-b border-border hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4">{idx + 1}</td>
                        <td className="py-3 px-4 font-medium">{soldier.full_name}</td>
                        <td className="py-3 px-4">{classData?.name || '-'}</td>
                        <td className="py-3 px-4">{deptData?.name || '-'}</td>
                        <td className="text-center py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              soldier.status === 'active'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : soldier.status === 'inactive'
                                ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}
                          >
                            {soldier.status === 'active' ? 'פעיל' : soldier.status === 'inactive' ? 'לא פעיל' : 'הועבר'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {soldiers && soldiers.length > 0 && (
        <p className="text-sm text-gray-600 text-center">
          סה״כ {soldiers.length} חיילים
        </p>
      )}
    </div>
  )
}
