import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import type { UserRole } from '@/lib/types'

const roleOptions: { value: UserRole; label: string; hint: string }[] = [
  { value: 'admin', label: 'Administration', hint: "Direction de l'école" },
  { value: 'teacher', label: 'Enseignant', hint: 'Avec ID enseignant' },
  { value: 'student', label: 'Élève', hint: 'Compte validé' },
]

function LoginPage() {
  useEffect(() => {
    document.title = 'Connexion — Sacré Cœur'
  }, [])

  const navigate = useNavigate()
  const [role, setRole] = useState<UserRole>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [teacherAccessId, setTeacherAccessId] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const effectivePassword = role === 'teacher' ? teacherAccessId : password
      const result = await login(email, effectivePassword)

      if (!result.ok) {
        setError(result.error ?? 'Échec de connexion')
        setIsLoading(false)
        return
      }

      if (result.role !== role) {
        setError(
          `Ce compte n'est pas enregistré en tant qu'${role === 'student' ? 'élève' : role === 'teacher' ? 'enseignant' : 'administrateur'}.`
        )
        setIsLoading(false)
        return
      }

      if (result.role === 'admin') navigate('/admin')
      else if (result.role === 'teacher') navigate('/teacher')
      else if (result.role === 'student') navigate('/student')
    } catch (err) {
      setError('Une erreur réseau ou serveur est survenue.' + err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background grid lg:grid-cols-2">
      <div className="hidden lg:block relative overflow-hidden bg-sacred-red">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_60%)]" />
        <div className="relative h-full flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-3">
            <div className="size-10 bg-white rounded-full grid place-items-center">
              <div className="size-4 rounded-full border-2 border-sacred-red" />
            </div>
            <span className="font-display text-2xl">Sacré Cœur</span>
          </Link>
          <div>
            <p className="font-display text-5xl italic leading-tight max-w-md">
              "Le savoir est une lumière qui ne s'éteint jamais."
            </p>
            <p className="text-sm opacity-70 mt-6 tracking-widest uppercase">
              A.M.D.G — Depuis 1948
            </p>
          </div>
          <div />
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <h1 className="font-display text-4xl mb-2">Connexion</h1>
          <p className="opacity-60 mb-8">Accédez à votre espace personnel.</p>

          <div className="grid grid-cols-3 gap-2 p-1.5 bg-muted rounded-2xl mb-8">
            {roleOptions.map(r => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                type="button"
                className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  role === r.value
                    ? 'bg-background shadow-sm text-sacred-red'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="auth-input"
                placeholder="vous@exemple.com"
              />
            </Field>

            {role === 'teacher' ? (
              <Field label="ID Enseignant">
                <input
                  type="text"
                  required
                  value={teacherAccessId}
                  onChange={e => setTeacherAccessId(e.target.value)}
                  className="auth-input font-mono"
                  placeholder="SC-T-2024-XXXX"
                />
              </Field>
            ) : (
              <Field label="Mot de passe">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="auth-input"
                  placeholder="••••••••"
                />
              </Field>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-3 rounded-xl bg-destructive/10 text-destructive text-sm"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-sacred-red text-white font-semibold shadow-lg shadow-sacred-red/20 hover:scale-[1.01] transition-transform disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Se connecter
            </button>
          </form>

          <div className="mt-6 text-center text-sm opacity-70">
            Pas encore inscrit ?{' '}
            <Link
              to="/inscription"
              className="text-sacred-red font-semibold hover:underline"
            >
              Créer un compte élève
            </Link>
          </div>

          <div className="mt-8 p-4 rounded-xl bg-muted text-xs opacity-70 leading-relaxed">
            <p className="font-bold mb-2 opacity-100">
              Comptes de démonstration
            </p>
            <p>
              Admin : <span className="font-mono">admin@sacrecoeur.edu</span> —
              mot de passe libre
            </p>
            <p>
              Enseignant :{' '}
              <span className="font-mono">kabongo@sacrecoeur.edu</span> — ID{' '}
              <span className="font-mono">SC-T-2024-8821</span>
            </p>
            <p>
              Élève : <span className="font-mono">jean.kabeya@student.edu</span>{' '}
              — mot de passe libre
            </p>
          </div>
        </motion.div>
      </div>

      <style>{`.auth-input { width: 100%; padding: 0.875rem 1rem; border-radius: 0.75rem; border: 1px solid var(--color-border); background: var(--color-background); color: var(--color-foreground); font-size: 0.95rem; outline: none; transition: all 0.2s; } .auth-input:focus { border-color: var(--sacred-red); box-shadow: 0 0 0 3px var(--ring); }`}</style>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-2 block">
        {label}
      </span>
      {children}
    </label>
  )
}

export default LoginPage
