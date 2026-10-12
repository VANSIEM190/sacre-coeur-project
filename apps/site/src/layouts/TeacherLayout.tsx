import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  CalendarDays,
  User,
} from 'lucide-react'
import { AuthenticatedDashboard } from '@sacre-coeur/school-features/layouts/AuthenticatedDashboard'

const teacherNavItems = [
  { to: '/teacher', label: 'Tableau de bord', icon: LayoutDashboard },
  {
    to: '/teacher/cotations',
    label: 'Fiches de cotation',
    icon: ClipboardList,
  },
  { to: '/teacher/classes', label: 'Mes classes', icon: Users },
  { to: '/teacher/horaires', label: 'Horaires', icon: CalendarDays },
  { to: '/teacher/profile', label: 'Profil', icon: User },
]

function TeacherLayout() {
  return (
    <AuthenticatedDashboard
      navItems={teacherNavItems}
      roleLabel="Enseignant"
    >
      <Outlet />
    </AuthenticatedDashboard>
  )
}

export default TeacherLayout
