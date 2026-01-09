import { getUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/Auth/LoginForm'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Common'

export default async function LoginPage() {
  // Redirect to dashboard if already logged in
  const user = await getUser()
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              מערכת ניהול אימונים רפואיים
            </CardTitle>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
              התחבר כדי להמשיך
            </p>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
