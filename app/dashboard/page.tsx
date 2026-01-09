import { requireAuth } from '@/lib/auth'
import { getSummaryStats, getAveragePassRate, getTrainingMetrics } from '@/lib/analytics'
import { DashboardCard } from '@/components/DataDisplay/DashboardCard'
import { MetricsTable } from '@/components/DataDisplay/MetricsTable'
import Link from 'next/link'
import { Button } from '@/components/Common'

export default async function DashboardPage() {
  const profile = await requireAuth()

  const scope = {
    role: profile.role,
    company_id: profile.company_id,
    department_id: profile.department_id,
    class_id: profile.class_id,
  }

  // Fetch dashboard data
  const [summaryStats, avgPassRate, metrics] = await Promise.all([
    getSummaryStats(scope),
    getAveragePassRate(scope),
    getTrainingMetrics(scope),
  ])

  // Calculate exceptions count (placeholder - will implement later)
  const exceptionsCount = 0

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">לוח בקרה</h1>
        {profile.role !== 'system_admin' && (
          <Link href="/data-entry">
            <Button variant="primary">+ הזנת נתונים חדשה</Button>
          </Link>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="סה״כ הפעלות (30 יום)"
          value={summaryStats.totalSessions}
          icon="📊"
          color="primary"
        />
        <DashboardCard
          title="חיילים שהתורגלו"
          value={summaryStats.uniqueSoldiersTrained}
          icon="👥"
          color="primary"
        />
        <DashboardCard
          title="אחוז כשרות ממוצע"
          value={`${avgPassRate}%`}
          icon={avgPassRate >= 90 ? '✅' : avgPassRate >= 70 ? '⚠️' : '❌'}
          color={avgPassRate >= 90 ? 'success' : avgPassRate >= 70 ? 'warning' : 'error'}
        />
        <DashboardCard
          title="חריגים"
          value={exceptionsCount}
          icon="🚨"
          color={exceptionsCount > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Metrics Table */}
      <MetricsTable metrics={metrics} />

      {/* Quick Actions */}
      {profile.role !== 'system_admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/data-entry" className="block">
            <div className="p-6 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors">
              <h3 className="text-lg font-semibold mb-2">הזנת נתונים</h3>
              <p className="text-sm opacity-90">הזן תוצאות אימון חדשות</p>
            </div>
          </Link>

          <Link href="/soldiers/list" className="block">
            <div className="p-6 bg-success text-white rounded-lg hover:bg-green-700 transition-colors">
              <h3 className="text-lg font-semibold mb-2">רשימת חיילים</h3>
              <p className="text-sm opacity-90">צפה בכל החיילים במערכת</p>
            </div>
          </Link>

          <Link href="/dashboard/analytics/exceptions" className="block">
            <div className="p-6 bg-warning text-white rounded-lg hover:bg-orange-700 transition-colors">
              <h3 className="text-lg font-semibold mb-2">חריגים</h3>
              <p className="text-sm opacity-90">צפה בחיילים עם חריגים</p>
            </div>
          </Link>
        </div>
      )}

      {/* Admin Actions */}
      {profile.role === 'system_admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/admin/org" className="block">
            <div className="p-6 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors">
              <h3 className="text-lg font-semibold mb-2">ניהול מבנה ארגוני</h3>
              <p className="text-sm opacity-90">ניהול מגמות, פלוגות, מחלקות וכיתות</p>
            </div>
          </Link>

          <Link href="/admin/users" className="block">
            <div className="p-6 bg-success text-white rounded-lg hover:bg-green-700 transition-colors">
              <h3 className="text-lg font-semibold mb-2">ניהול משתמשים</h3>
              <p className="text-sm opacity-90">יצירת משתמשי מ״פ ומ״מ</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
