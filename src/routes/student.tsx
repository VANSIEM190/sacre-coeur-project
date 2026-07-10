import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Megaphone,
  BookOpen,
  CalendarDays,
  Award,
  CreditCard,
  Users,
} from 'lucide-react'
import { DashboardShell } from '@/components/Dashboard-shell'

const studentNavItems = [
  { to: '/parent', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/parent/annonces', label: 'Annonces', icon: Megaphone },
  { to: '/parent/cours', label: 'Cours', icon: BookOpen },
  { to: '/parent/horaires', label: 'Horaires', icon: CalendarDays },
  { to: '/parent/points', label: 'Points & Bulletins', icon: Award },
  { to: '/parent/mesEnfants', label: 'Mes enfants', icon: Users },
  { to: '/parent/paiements', label: 'Reçus', icon: CreditCard },
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
