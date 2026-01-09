import { Card, CardContent } from '@/components/Common'

interface DashboardCardProps {
  title: string
  value: string | number
  icon?: string
  color?: 'primary' | 'success' | 'warning' | 'error'
}

export function DashboardCard({ title, value, icon, color = 'primary' }: DashboardCardProps) {
  const colorClasses = {
    primary: 'bg-blue-50 text-primary dark:bg-blue-900/20',
    success: 'bg-green-50 text-success dark:bg-green-900/20',
    warning: 'bg-orange-50 text-warning dark:bg-orange-900/20',
    error: 'bg-red-50 text-error dark:bg-red-900/20',
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        {icon && (
          <div className={`text-4xl p-3 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
