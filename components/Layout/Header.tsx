import { signOut } from '@/app/login/actions'
import { Button } from '@/components/Common'
import { ROLE_LABELS } from '@/lib/constants'
import { UserProfile } from '@/lib/supabase/types'

interface HeaderProps {
  profile: UserProfile
}

export function Header({ profile }: HeaderProps) {
  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold">מערכת ניהול אימונים</h1>
          <span className="text-sm bg-primary-hover px-2 py-1 rounded">
            {ROLE_LABELS[profile.role]}
          </span>
        </div>

        <form action={signOut}>
          <Button
            type="submit"
            variant="secondary"
            size="sm"
          >
            התנתק
          </Button>
        </form>
      </div>
    </header>
  )
}
