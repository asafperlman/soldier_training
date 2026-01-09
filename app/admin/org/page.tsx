import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Common'
import { OrgManagementTabs } from '@/components/Admin/OrgManagementTabs'

export default async function AdminOrgPage() {
  await requireRole(['system_admin'])

  const supabase = await createClient()

  // Fetch all org data
  const [{ data: magamas }, { data: companies }, { data: departments }, { data: classes }] =
    await Promise.all([
      supabase.from('magamas').select('*').order('name'),
      supabase
        .from('companies')
        .select('*, magamas(name)')
        .order('name'),
      supabase
        .from('departments')
        .select('*, companies(name, magama_id)')
        .order('name'),
      supabase
        .from('classes')
        .select('*, departments(name, company_id)')
        .order('name'),
    ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">ניהול מבנה ארגוני</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          יצירה ועריכה של מגמות, פלוגות, מחלקות וכיתות
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <OrgManagementTabs
            magamas={magamas || []}
            companies={companies || []}
            departments={departments || []}
            classes={classes || []}
          />
        </CardContent>
      </Card>
    </div>
  )
}
