import { Link, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Moon, Sun, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import schoolBuilding from '@/assets/imgAcc.jpg'

const navLinks = [
  { to: '/ecole', label: "L'École" },
  { to: '/autorites', label: 'Autorités' },
  { to: '/support', label: 'Support' },
  { to: '/confidentialite', label: 'Confidentialité' },
] as const

export function PublicHeader() {
  const theme = useAuthStore(s => s.theme)
  const toggleTheme = useAuthStore(s => s.toggleTheme)
  const currentUser = useAuthStore(s => s.currentUser)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group ">
          <img
            src={schoolBuilding}
            alt="Bâtiment principal de l'école"
            className="relative size-10 bg-white  object-cover rounded-4xl shadow-2xl"
            width={30}
            height={30}
          />
          <span className="font-display text-2xl font-medium tracking-tight">
            Sacré Cœur
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) =>
                `transition-all hover:text-sacred-red ${isActive ? 'opacity-100 text-sacred-red' : 'opacity-70 hover:opacity-100'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Basculer le thème"
            className="size-10 rounded-full border border-border grid place-items-center hover:bg-muted transition-colors"
          >
            {theme === 'light' ? (
              <Moon className="size-4" />
            ) : (
              <Sun className="size-4" />
            )}
          </button>

          {currentUser ? (
            <Link
              to={
                currentUser.role === 'admin'
                  ? '/admin'
                  : currentUser.role === 'teacher'
                    ? '/teacher'
                    : '/parent'
              }
              className="hidden sm:inline-flex px-5 py-2.5 rounded-full bg-sacred-red text-white text-sm font-semibold shadow-lg shadow-sacred-red/20 hover:scale-105 transition-transform"
            >
              Mon espace
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-flex px-5 py-2.5 rounded-full border border-border text-sm font-semibold hover:bg-card transition-all"
              >
                Connexion
              </Link>
              <Link
                to="/inscription"
                className="hidden sm:inline-flex px-5 py-2.5 rounded-full bg-sacred-red text-white text-sm font-semibold shadow-lg shadow-sacred-red/20 hover:scale-105 transition-transform"
              >
                Inscription
              </Link>
            </>
          )}

          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden size-10 rounded-full border border-border grid place-items-center"
            aria-label="Menu"
          >
            {mobileOpen ? (
              <X className="size-4" />
            ) : (
              <Menu className="size-4" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="md:hidden border-t border-border bg-background"
        >
          <div className="px-6 py-4 flex flex-col gap-3">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="py-2 text-sm font-medium"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!currentUser && (
              <div className="flex gap-2 pt-2 border-t border-border">
                <Link
                  to="/login"
                  className="flex-1 text-center py-2 rounded-full border border-border text-sm font-semibold"
                >
                  Connexion
                </Link>
                <Link
                  to="/inscription"
                  className="flex-1 text-center py-2 rounded-full bg-sacred-red text-white text-sm font-semibold"
                >
                  Inscription
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
