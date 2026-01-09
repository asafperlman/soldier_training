import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { computeExceptions, getSoldierHistory } from '@/lib/exceptions'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/Common'
import Link from 'next/link'
import { EXCEPTION_LABELS, EXCEPTIONS_CONFIG } from '@/lib/constants'
import { notFound } from 'next/navigation'

export default async function SoldierExceptionDetailPage({
  params,
}: {
  params: { soldierId: string }
}) {
  const profile = await requireRole(['company', 'department', 'class'])
  const supabase = await createClient()

  // Get soldier info
  const { data: soldier, error } = await supabase
    .from('soldiers')
    .select(`
      id,
      full_name,
      status,
      class_id,
      department_id,
      company_id,
      classes!inner(id, name, department_id, departments!inner(id, name, company_id, companies!inner(name)))
    `)
    .eq('id', params.soldierId)
    .single()

  if (error || !soldier) {
    return notFound()
  }

  // Verify access (RLS should handle this, but double-check)
  const classData = (soldier as any).classes
  const deptData = classData.departments
  const companyData = deptData.companies

  if (
    (profile.role === 'class' && soldier.class_id !== profile.class_id) ||
    (profile.role === 'department' && soldier.department_id !== profile.department_id) ||
    (profile.role === 'company' && soldier.company_id !== profile.company_id)
  ) {
    return notFound()
  }

  // Compute exceptions for this soldier
  const exceptions = await computeExceptions({ classId: soldier.class_id })
  const soldierException = exceptions.find((e) => e.soldierId === params.soldierId)

  // Get recent history
  const history = await getSoldierHistory(params.soldierId, 15)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <Link href="/dashboard/analytics/exceptions" className="hover:text-primary">
          ← חזרה למרכז חריגים
        </Link>
      </div>

      {/* Soldier Header */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{soldier.full_name}</h1>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>כיתה: {classData.name}</p>
                <p>מחלקה: {deptData.name}</p>
                <p>פלוגה: {companyData.name}</p>
                <p>
                  סטטוס:{' '}
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      soldier.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {soldier.status === 'active' ? 'פעיל' : 'לא פעיל'}
                  </span>
                </p>
              </div>
            </div>
            <Link href={`/data-entry?classId=${soldier.class_id}`}>
              <Button variant="primary">+ הוסף אימון חדש</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Exceptions Summary */}
      {soldierException && soldierException.exceptions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>חריגים מזוהים</span>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  soldierException.highestSeverity === 'high'
                    ? 'bg-red-100 text-red-800'
                    : soldierException.highestSeverity === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                חומרה:{' '}
                {soldierException.highestSeverity === 'high'
                  ? 'גבוהה'
                  : soldierException.highestSeverity === 'medium'
                  ? 'בינונית'
                  : 'נמוכה'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {soldierException.exceptions.map((exception, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-2 ${
                    exception.severity === 'high'
                      ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                      : exception.severity === 'medium'
                      ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                      : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {exception.severity === 'high'
                          ? '🔴'
                          : exception.severity === 'medium'
                          ? '🟡'
                          : '🔵'}
                      </span>
                      <div>
                        <h3 className="font-bold text-lg">{exception.trainingTypeName}</h3>
                        <p className="text-sm text-gray-600">{EXCEPTION_LABELS[exception.type]}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm mt-2">{exception.details}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>הסבר:</strong> החריגים מחושבים על סמך הביצועים ב-
                {EXCEPTIONS_CONFIG.rollingDays} יום האחרונים. כדי לשפר, יש לתרגל את האימונים
                המסומנים ולהשיג תוצאות טובות יותר.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-bold mb-2">אין חריגים</h3>
            <p className="text-gray-600">החייל עומד בכל הדרישות</p>
          </CardContent>
        </Card>
      )}

      {/* Recent History */}
      <Card>
        <CardHeader>
          <CardTitle>היסטוריית אימונים ({history.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>אין אימונים ב-{EXCEPTIONS_CONFIG.rollingDays} יום האחרונים</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-start py-3 px-4 font-medium">תאריך</th>
                    <th className="text-start py-3 px-4 font-medium">אימון</th>
                    <th className="text-center py-3 px-4 font-medium">ניסיונות</th>
                    <th className="text-center py-3 px-4 font-medium">הטוב ביותר</th>
                    <th className="text-center py-3 px-4 font-medium">ממוצע (ללא הטוב)</th>
                    <th className="text-center py-3 px-4 font-medium">סטטוס</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.sessionId} className="border-b border-border">
                      <td className="py-3 px-4">
                        {new Date(item.sessionAt).toLocaleDateString('he-IL', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4">{item.trainingName}</td>
                      <td className="text-center py-3 px-4">{item.attemptCount}</td>
                      <td className="text-center py-3 px-4 font-medium">
                        {typeof item.best === 'number'
                          ? `${item.best}s`
                          : item.best
                          ? 'כן'
                          : 'לא'}
                      </td>
                      <td className="text-center py-3 px-4">
                        {item.avgAfterBest !== null ? `${item.avgAfterBest.toFixed(1)}s` : '-'}
                      </td>
                      <td className="text-center py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            item.passed
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.passed ? '✓ עבר' : '✗ נכשל'}
                        </span>
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
