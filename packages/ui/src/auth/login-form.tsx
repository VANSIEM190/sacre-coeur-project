import type { FormEvent, ReactNode } from 'react'
import { AuthLayout, AuthField, AuthError } from './auth-layout'

export interface LoginRoleOption<Role extends string> {
  value: Role
  label: string
}

interface LoginFormProps<Role extends string> {
  roleOptions: readonly LoginRoleOption<Role>[]
  role: Role
  email: string
  password: string
  error: string
  isLoading: boolean
  subtitle?: string
  footer?: ReactNode
  onRoleChange: (role: Role) => void
  onEmailChange: (email: string) => void
  onPasswordChange: (password: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function LoginForm<Role extends string>({
  roleOptions, role, email, password, error, isLoading,
  subtitle = 'Accédez à votre espace personnel.', footer,
  onRoleChange, onEmailChange, onPasswordChange, onSubmit,
}: LoginFormProps<Role>) {
  return (
    <AuthLayout title="Connexion" subtitle={subtitle}>
      {roleOptions.length > 1 ? (
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-muted rounded-2xl mb-8">
          {roleOptions.map(option => (
            <button key={option.value} onClick={() => onRoleChange(option.value)} type="button"
              disabled={isLoading} aria-pressed={role === option.value}
              className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
                role === option.value ? 'bg-background shadow-sm text-sacred-red' : 'opacity-60 hover:opacity-100'
              }`}>
              {option.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="py-3 text-center text-xs font-semibold bg-muted rounded-2xl mb-8 text-sacred-red">
          {roleOptions[0]?.label}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <AuthField label="Email">
          <input type="email" required autoComplete="email" value={email}
            onChange={event => onEmailChange(event.target.value)}
            className="auth-input" placeholder="vous@exemple.com" />
        </AuthField>
        <AuthField label="Mot de passe">
          <input type="password" required autoComplete="current-password" value={password}
            onChange={event => onPasswordChange(event.target.value)}
            className="auth-input" placeholder="••••••••" />
        </AuthField>
        <AuthError message={error} />
        <button type="submit" disabled={isLoading}
          className="w-full py-3.5 rounded-xl bg-sacred-red text-white font-semibold shadow-lg shadow-sacred-red/20 hover:scale-[1.01] transition-transform disabled:cursor-not-allowed">
          {isLoading ? 'Chargement...' : 'Se connecter'}
        </button>
      </form>
      {footer && <div className="mt-6 text-center text-sm opacity-70 space-y-2">{footer}</div>}
    </AuthLayout>
  )
}
