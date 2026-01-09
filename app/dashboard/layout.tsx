import { requireAuth } from '@/lib/auth'
import { Header } from '@/components/Layout/Header'
import { Navigation } from '@/components/Layout/Navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <Header profile={profile} />
      <Navigation profile={profile} />
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
