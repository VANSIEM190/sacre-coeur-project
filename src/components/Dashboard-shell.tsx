import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, Moon, Sun, Menu, X, type LucideIcon } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useEffect, useState, type ReactNode } from 'react'

export interface DashboardNavItem {
  to: string
  label: string
  icon: LucideIcon
}

interface DashboardShellProps {
  navItems: DashboardNavItem[]
  roleLabel: string
  requiredRole: 'admin' | 'teacher' | 'student' | 'parent'
  children: ReactNode
}

export function DashboardShell({
  navItems,
  roleLabel,
  requiredRole,
  children,
}: DashboardShellProps) {
  const navigate = useNavigate()
  const currentUser = useAuthStore(s => s.currentUser)
  const logout = useAuthStore(s => s.logout)
  const theme = useAuthStore(s => s.theme)
  const toggleTheme = useAuthStore(s => s.toggleTheme)
  const pathname = useLocation().pathname

  // État pour gérer l'ouverture de la sidebar sur mobile
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!currentUser || currentUser.role !== requiredRole) {
      navigate('/login')
    }
  }, [currentUser, requiredRole, navigate])

  if (!currentUser || currentUser.role !== requiredRole) {
    return (
      <div className="min-h-screen grid place-items-center text-sm opacity-60">
        Redirection…
      </div>
    )
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
      {/* --- TOPBAR MOBILE --- */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border px-4 flex items-center justify-between z-40">
        <Link to="/" className="flex items-center gap-3">
          <div className="size-8 bg-sacred-red rounded-full grid place-items-center shadow-lg shadow-sacred-red/20">
            <div className="size-3 rounded-full border-2 border-sacred-gold" />
          </div>
          <p className="font-display text-md leading-tight">Sacré Cœur</p>
        </Link>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl bg-muted border border-border text-foreground hover:opacity-80 transition-opacity"
          aria-label="Menu"
        >
          {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      {/* --- BACKDROP MOBILE --- */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-background/60 backdrop-blur-sm z-45"
        />
      )}

      {/* --- SIDEBAR RESPONSIVE & FIXED --- */}
      <aside
        className={`fixed h-screen top-0 bottom-0 left-0 w-72 flex flex-col border-r border-border bg-card z-50 transform transition-transform duration-300 
          lg:translate-x-0 lg:sticky
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="size-9 bg-sacred-red rounded-full grid place-items-center shadow-lg shadow-sacred-red/20">
              <div className="size-3.5 rounded-full border-2 border-sacred-gold" />
            </div>
            <div>
              <p className="font-display text-lg leading-tight">Sacré Cœur</p>
              <p className="text-[10px] uppercase tracking-widest opacity-50">
                {roleLabel}
              </p>
            </div>
          </Link>

          {/* Bouton fermeture interne pour mobile */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-muted text-foreground/60"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active =
              pathname === item.to ||
              (item.to !== `/${requiredRole}` && pathname.startsWith(item.to))
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-sacred-red text-white shadow-md shadow-sacred-red/20'
                    : 'opacity-70 hover:opacity-100 hover:bg-muted'
                }`}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <div className="px-3 py-2 rounded-xl bg-muted">
            <p className="text-xs font-semibold truncate">
              {currentUser.fullName}
            </p>
            <p className="text-[10px] opacity-60 truncate">
              {currentUser.email}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className="flex-1 py-2 rounded-xl border border-border hover:bg-muted transition-colors grid place-items-center"
              aria-label="Thème"
            >
              {theme === 'light' ? (
                <Moon className="size-4" />
              ) : (
                <Sun className="size-4" />
              )}
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 py-2 rounded-xl border border-border hover:bg-destructive hover:text-destructive-foreground transition-colors grid place-items-center"
              aria-label="Déconnexion"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* --- CONTENT AREA AREA (Ajustement du padding top pour mobile) --- */}
      <main className="flex-1 min-w-0 pt-16 lg:pt-0">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 lg:p-10 max-w-7xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm opacity-60">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
