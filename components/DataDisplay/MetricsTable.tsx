import { Card, CardHeader, CardTitle, CardContent } from '@/components/Common'

interface Metric {
  name: string
  sessions: number
  avgBest: string | null
  passRate: number
  failed: number
}

interface MetricsTableProps {
  metrics: Metric[]
}

export function MetricsTable({ metrics }: MetricsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ביצועים לפי סוג אימון</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-start py-3 px-4 font-medium">סוג אימון</th>
                <th className="text-center py-3 px-4 font-medium">הפעלות</th>
                <th className="text-center py-3 px-4 font-medium">ממוצע</th>
                <th className="text-center py-3 px-4 font-medium">אחוז עמידה</th>
                <th className="text-center py-3 px-4 font-medium">כשלונות</th>
              </tr>
            </thead>
            <tbody>
              {metrics.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    אין נתונים להצגה
                  </td>
                </tr>
              ) : (
                metrics.map((metric, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-4">{metric.name}</td>
                    <td className="text-center py-3 px-4">{metric.sessions}</td>
                    <td className="text-center py-3 px-4">
                      {metric.avgBest ? `${metric.avgBest}s` : '-'}
                    </td>
                    <td className="text-center py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          metric.passRate >= 90
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : metric.passRate >= 70
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {metric.passRate}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      {metric.failed > 0 ? (
                        <span className="text-error font-medium">{metric.failed}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
