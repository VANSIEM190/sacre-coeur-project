import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Megaphone,
  BookOpen,
  CalendarDays,
  Users,
  GraduationCap,
  Archive,
  Trophy,
  CreditCard,
  UserCheck,
  Coins,
  Settings,
  User,
} from 'lucide-react'
import { DashboardShell } from '@/components/Dashboard-shell'

const adminNavItems = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/admin/annonces', label: 'Annonces', icon: Megaphone },
  { to: '/admin/cours', label: 'Cours', icon: BookOpen },
  { to: '/admin/horaires', label: 'Horaires', icon: CalendarDays },
  { to: '/admin/classes', label: 'Classes', icon: Users },
  { to: '/admin/validations', label: 'Validations', icon: UserCheck },
  { to: '/admin/enseignants', label: 'Enseignants', icon: GraduationCap },
  { to: '/admin/archives', label: 'Archives', icon: Archive },
  { to: '/admin/palmares', label: 'Palmarès', icon: Trophy },
  { to: '/admin/paiements', label: 'Paiements', icon: CreditCard },
  { to: '/admin/mode-de-paiement', label: 'mode de paiement', icon: Coins },
  { to: '/admin/parametre', label: 'Paramètre', icon: Settings },
  { to: '/admin/profile', label: 'Profil', icon: User },
]

function AdminLayout() {
  return (
    <DashboardShell
      navItems={adminNavItems}
      roleLabel="Administration"
      requiredRole="admin"
    >
      <Outlet />
    </DashboardShell>
  )
}

export default AdminLayout
