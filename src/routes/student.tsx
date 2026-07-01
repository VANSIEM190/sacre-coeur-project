import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Megaphone,
  BookOpen,
  CalendarDays,
  Award,
  CreditCard,
} from 'lucide-react'
import { DashboardShell } from '@/components/Dashboard-shell'

const studentNavItems = [
  { to: '/student', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/student/annonces', label: 'Annonces', icon: Megaphone },
  { to: '/student/cours', label: 'Cours', icon: BookOpen },
  { to: '/student/horaires', label: 'Horaires', icon: CalendarDays },
  { to: '/student/points', label: 'Points & Bulletins', icon: Award },
  { to: '/student/paiements', label: 'Reçus', icon: CreditCard },
]

function StudentLayout() {
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

export default StudentLayout
