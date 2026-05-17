import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  CalendarDays,
} from 'lucide-react'
import { DashboardShell } from '@/components/dashboard-shell'

const teacherNavItems = [
  { to: '/teacher', label: 'Tableau de bord', icon: LayoutDashboard },
  {
    to: '/teacher/cotations',
    label: 'Fiches de cotation',
    icon: ClipboardList,
  },
  { to: '/teacher/classes', label: 'Mes classes', icon: Users },
  { to: '/teacher/horaires', label: 'Horaires', icon: CalendarDays },
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
