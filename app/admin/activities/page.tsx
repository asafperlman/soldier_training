import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Common'
import { ActivitiesManagement } from '@/components/Admin/ActivitiesManagement'

export default async function ActivitiesPage() {
  // Only company commanders (מ״פ) and system_admin can access
  const profile = await requireRole(['company', 'system_admin'])

  const supabase = await createClient()

  // Fetch user's company activities
  const { data: activities, error } = await supabase
    .from('company_activities')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching activities:', error)
  }

  // Get company name for display
  let companyName = ''
  if (profile.company_id) {
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', profile.company_id)
      .single()

    companyName = company?.name || ''
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">ניהול פעילויות</h1>
        {companyName && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            פלוגה: <span className="font-semibold">{companyName}</span>
          </p>
        )}
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          הגדרת פעילויות וזמנים נדרשים עבור הפלוגה
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>פעילויות הפלוגה</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivitiesManagement
            activities={activities || []}
            userRole={profile.role}
            companyId={profile.company_id || null}
          />
        </CardContent>
      </Card>
    </div>
  )
}
