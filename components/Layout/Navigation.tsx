'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserProfile } from '@/lib/supabase/types'

interface NavItem {
  href: string
  label: string
  roles: string[]
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'לוח בקרה',
    roles: ['system_admin', 'company', 'department', 'class'],
  },
  {
    href: '/data-entry',
    label: 'הזנת נתונים',
    roles: ['company', 'department', 'class'],
  },
  {
    href: '/soldiers/add',
    label: 'הוספת חיילים',
    roles: ['department', 'class'],
  },
  {
    href: '/soldiers/list',
    label: 'רשימת חיילים',
    roles: ['company', 'department', 'class'],
  },
  {
    href: '/dashboard/analytics/exceptions',
    label: 'חריגים',
    roles: ['company', 'department', 'class'],
  },
  {
    href: '/admin/org',
    label: 'ניהול מבנה ארגוני',
    roles: ['system_admin'],
  },
  {
    href: '/admin/users',
    label: 'ניהול משתמשים',
    roles: ['system_admin'],
  },
  {
    href: '/admin/class-leaders',
    label: 'ניהול מכ״יים',
    roles: ['department'],
  },
]

interface NavigationProps {
  profile: UserProfile
}

export function Navigation({ profile }: NavigationProps) {
  const pathname = usePathname()

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(profile.role)
  )

  return (
    <nav className="bg-card-bg border-b border-border">
      <div className="container mx-auto px-4">
        <ul className="flex gap-2 overflow-x-auto">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-600 dark:text-gray-400 hover:text-primary hover:border-b-2 hover:border-primary'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
