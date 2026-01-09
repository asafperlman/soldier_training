import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { computeExceptions } from '@/lib/exceptions'
import { Card, CardHeader, CardTitle, CardContent, Select } from '@/components/Common'
import Link from 'next/link'
import { EXCEPTIONS_CONFIG, EXCEPTION_LABELS } from '@/lib/constants'

export default async function ExceptionsCenterPage({
  searchParams,
}: {
  searchParams: { trainingType?: string; department?: string; class?: string }
}) {
  const profile = await requireRole(['company', 'department', 'class'])
  const supabase = await createClient()

  // Determine scope
  const scope: {
    departmentId?: string
    classId?: string
    trainingTypeId?: string
  } = {}

  if (profile.role === 'class' && profile.class_id) {
    scope.classId = profile.class_id
  } else if (profile.role === 'department' && profile.department_id) {
    scope.departmentId = searchParams.class || profile.department_id
  } else if (profile.role === 'company' && profile.company_id) {
    scope.departmentId = searchParams.department
    scope.classId = searchParams.class
  }

  if (searchParams.trainingType) {
    scope.trainingTypeId = searchParams.trainingType
  }

  // Compute exceptions
  const exceptions = await computeExceptions(scope)

  // Get training types for filter
  const { data: trainingTypes } = await supabase
    .from('training_types')
    .select('id, name')

  // Get departments/classes for filters (based on role)
  let departments: any[] = []
  let classes: any[] = []

  if (profile.role === 'company' && profile.company_id) {
    const { data: depts } = await supabase
      .from('departments')
      .select('id, name')
      .eq('company_id', profile.company_id)

    departments = depts || []

    if (searchParams.department) {
      const { data: cls } = await supabase
        .from('classes')
        .select('id, name')
        .eq('department_id', searchParams.department)

      classes = cls || []
    }
  } else if (profile.role === 'department' && profile.department_id) {
    const { data: cls } = await supabase
      .from('classes')
      .select('id, name')
      .eq('department_id', profile.department_id)

    classes = cls || []
  }

  const highCount = exceptions.filter((e) => e.highestSeverity === 'high').length
  const mediumCount = exceptions.filter((e) => e.highestSeverity === 'medium').length
  const lowCount = exceptions.filter((e) => e.highestSeverity === 'low').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">מרכז חריגים</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          ניתוח חריגים עבור ה-{EXCEPTIONS_CONFIG.rollingDays} יום האחרונים
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">חומרה גבוהה</p>
                <p className="text-2xl font-bold text-red-600">{highCount}</p>
              </div>
              <div className="text-4xl">🔴</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">חומרה בינונית</p>
                <p className="text-2xl font-bold text-yellow-600">{mediumCount}</p>
              </div>
              <div className="text-4xl">🟡</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">חומרה נמוכה</p>
                <p className="text-2xl font-bold text-blue-600">{lowCount}</p>
              </div>
              <div className="text-4xl">🔵</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>סינונים</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="סוג אימון"
              name="trainingType"
              value={searchParams.trainingType || ''}
              options={[
                { value: '', label: 'הכל' },
                ...(trainingTypes || []).map((t) => ({ value: t.id, label: t.name })),
              ]}
              onChange={(e) => {
                const form = e.currentTarget.form
                if (form) form.submit()
              }}
            />

            {profile.role === 'company' && (
              <Select
                label="מחלקה"
                name="department"
                value={searchParams.department || ''}
                options={[
                  { value: '', label: 'הכל' },
                  ...departments.map((d) => ({ value: d.id, label: d.name })),
                ]}
                onChange={(e) => {
                  const form = e.currentTarget.form
                  if (form) form.submit()
                }}
              />
            )}

            {(profile.role === 'company' || profile.role === 'department') && classes.length > 0 && (
              <Select
                label="כיתה"
                name="class"
                value={searchParams.class || ''}
                options={[
                  { value: '', label: 'הכל' },
                  ...classes.map((c) => ({ value: c.id, label: c.name })),
                ]}
                onChange={(e) => {
                  const form = e.currentTarget.form
                  if (form) form.submit()
                }}
              />
            )}
          </form>
        </CardContent>
      </Card>

      {/* Exceptions List */}
      <Card>
        <CardHeader>
          <CardTitle>רשימת חריגים ({exceptions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {exceptions.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-lg font-medium">אין חריגים!</p>
              <p className="text-sm">כל החיילים עומדים בדרישות</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-start py-3 px-4 font-medium">חייל</th>
                    <th className="text-start py-3 px-4 font-medium">כיתה</th>
                    <th className="text-start py-3 px-4 font-medium">מחלקה</th>
                    <th className="text-start py-3 px-4 font-medium">חריגים</th>
                    <th className="text-center py-3 px-4 font-medium">חומרה</th>
                    <th className="text-center py-3 px-4 font-medium">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {exceptions.map((exception) => (
                    <tr
                      key={exception.soldierId}
                      className="border-b border-border hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="py-3 px-4 font-medium">{exception.soldierName}</td>
                      <td className="py-3 px-4">{exception.className}</td>
                      <td className="py-3 px-4">{exception.departmentName}</td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {exception.exceptions.slice(0, 2).map((ex, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-medium">{ex.trainingTypeName}:</span>{' '}
                              {EXCEPTION_LABELS[ex.type]}
                            </div>
                          ))}
                          {exception.exceptions.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{exception.exceptions.length - 2} נוספים
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            exception.highestSeverity === 'high'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : exception.highestSeverity === 'medium'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}
                        >
                          {exception.highestSeverity === 'high'
                            ? 'גבוהה'
                            : exception.highestSeverity === 'medium'
                            ? 'בינונית'
                            : 'נמוכה'}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Link
                          href={`/dashboard/analytics/exceptions/${exception.soldierId}`}
                          className="text-primary hover:underline text-sm"
                        >
                          צפה בפרטים →
                        </Link>
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
