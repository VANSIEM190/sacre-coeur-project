import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  CalendarDays,
  User,
} from 'lucide-react'
import { DashboardShell } from '@/components/Dashboard-shell'

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
    <DashboardShell
      navItems={teacherNavItems}
      roleLabel="Enseignant"
      requiredRole="teacher"
    >
      <Outlet />
    </DashboardShell>
  )
}

export default TeacherLayout
