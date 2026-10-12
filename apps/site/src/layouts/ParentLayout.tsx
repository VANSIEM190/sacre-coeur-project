import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Megaphone,
  BookOpen,
  CalendarDays,
  Users,
  User,
} from 'lucide-react'
import { AuthenticatedDashboard } from '@sacre-coeur/school-features/layouts/AuthenticatedDashboard'

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
    <AuthenticatedDashboard
      navItems={studentNavItems}
      roleLabel="parent"
    >
      <Outlet />
    </AuthenticatedDashboard>
  )
}

export default ParentLayout
