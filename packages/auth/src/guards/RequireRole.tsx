import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { UserRole } from '@sacre-coeur/domain/types'
import { useAuthStore } from '../stores/auth-store'
import { SessionLoading } from '../components/session-loading'

interface RequireRoleProps {
  role: UserRole
  children?: ReactNode
}

export function RequireRole({ role, children }: RequireRoleProps) {
  const currentUser = useAuthStore(state => state.currentUser)
  const status = useAuthStore(state => state.status)
  const location = useLocation()

  if (status === 'loading') return <SessionLoading />
  if (!currentUser || currentUser.role !== role) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children ?? <Outlet />
}
