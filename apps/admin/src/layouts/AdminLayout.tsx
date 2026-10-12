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
import { AuthenticatedDashboard } from '@sacre-coeur/school-features/layouts/AuthenticatedDashboard'

const adminNavItems = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/annonces', label: 'Annonces', icon: Megaphone },
  { to: '/cours', label: 'Cours', icon: BookOpen },
  { to: '/horaires', label: 'Horaires', icon: CalendarDays },
  { to: '/classes', label: 'Classes', icon: Users },
  { to: '/validations', label: 'Validations', icon: UserCheck },
  { to: '/enseignants', label: 'Enseignants', icon: GraduationCap },
  { to: '/archives', label: 'Archives', icon: Archive },
  { to: '/palmares', label: 'Palmarès', icon: Trophy },
  { to: '/paiements', label: 'Paiements', icon: CreditCard },
  { to: '/mode-de-paiement', label: 'mode de paiement', icon: Coins },
  { to: '/parametre', label: 'Paramètre', icon: Settings },
  { to: '/profile', label: 'Profil', icon: User },
]

function AdminLayout() {
  return (
    <AuthenticatedDashboard
      navItems={adminNavItems}
      roleLabel="Administration"
    >
      <Outlet />
    </AuthenticatedDashboard>
  )
}

export default AdminLayout
