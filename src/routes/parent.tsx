import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Megaphone,
  BookOpen,
  CalendarDays,
  Users,
  User,
} from 'lucide-react'
import { DashboardShell } from '@/components/Dashboard-shell'

const studentNavItems = [
  { to: '/parent', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/parent/annonces', label: 'Annonces', icon: Megaphone },
  { to: '/parent/cours', label: 'Cours', icon: BookOpen },
  { to: '/parent/horaires', label: 'Horaires', icon: CalendarDays },
  { to: '/parent/mesEnfants', label: 'Mes enfants', icon: Users },
  { to: '/parent/profile', label: 'Profil', icon: User },
]

function ParentLayout() {
  return (
    <DashboardShell
      navItems={studentNavItems}
      roleLabel="parent"
      requiredRole="parent"
    >
      <Outlet />
    </DashboardShell>
  )
}

export default ParentLayout
