import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@sacre-coeur/auth/stores/auth-store'
import { DashboardShell, type DashboardNavItem } from '@sacre-coeur/ui/layouts/dashboard-shell'
import type { ReactNode } from 'react'
import { SupabaseErrorHandler } from '../feedback/supabase-error-handler'

export function AuthenticatedDashboard({ navItems, roleLabel, children }: {
  navItems: DashboardNavItem[]
  roleLabel: string
  children: ReactNode
}) {
  const user = useAuthStore(s => s.currentUser)
  const logout = useAuthStore(s => s.logout)
  const navigate = useNavigate()
  if (!user) return null
  const handleLogout = async () => {
    try { await logout(); navigate('/login', { replace: true }) }
    catch (error) { SupabaseErrorHandler.handle(error) }
  }
  return <DashboardShell navItems={navItems} roleLabel={roleLabel} user={user} onLogout={handleLogout}>{children}</DashboardShell>
}

