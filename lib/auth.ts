import { createClient } from '@/lib/supabase/server'
import { UserProfile } from '@/lib/supabase/types'
import { redirect } from 'next/navigation'

/**
 * Get current session and user from server-side
 * Returns null if not authenticated
 */
export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/**
 * Get current user from server-side
 * Returns null if not authenticated
 */
export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Get user profile with role and scope
 * Returns null if not authenticated or profile doesn't exist
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return profile
}

/**
 * Require authentication - redirects to login if not authenticated
 * Returns user profile
 */
export async function requireAuth(): Promise<UserProfile> {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  return profile
}

/**
 * Require specific role - redirects to dashboard if wrong role
 */
export async function requireRole(allowedRoles: string[]): Promise<UserProfile> {
  const profile = await requireAuth()

  if (!allowedRoles.includes(profile.role)) {
    redirect('/dashboard')
  }

  return profile
}

/**
 * Check if user has admin role
 */
export async function isAdmin(): Promise<boolean> {
  const profile = await getUserProfile()
  return profile?.role === 'system_admin'
}

/**
 * Get user's scope IDs for filtering queries
 */
export async function getUserScope() {
  const profile = await getUserProfile()

  if (!profile) {
    return null
  }

  return {
    role: profile.role,
    magama_id: profile.magama_id,
    company_id: profile.company_id,
    department_id: profile.department_id,
    class_id: profile.class_id,
  }
}
