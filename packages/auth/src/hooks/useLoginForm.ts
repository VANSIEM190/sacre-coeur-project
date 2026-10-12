import { useState, type FormEvent } from 'react'
import type { UserRole } from '@sacre-coeur/domain/types'
import { useAuthStore } from '../stores/auth-store'

interface UseLoginFormOptions {
  initialRole: UserRole
  onAuthenticated: (role: UserRole) => void
}

export function useLoginForm({ initialRole, onAuthenticated }: UseLoginFormOptions) {
  const login = useAuthStore(state => state.login)
  const sessionError = useAuthStore(state => state.error)
  const [role, setRole] = useState(initialRole)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const changeRole = (nextRole: UserRole) => {
    setRole(nextRole)
    setPassword('')
    setError('')
    useAuthStore.setState({ error: null })
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isLoading) return
    setError('')
    setIsLoading(true)
    try {
      const result = await login(email, password, role)
      if (result.ok && result.role) {
        setPassword('')
        onAuthenticated(result.role)
      } else {
        setError(result.error ?? 'Échec de connexion.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    role, email, password, error: error || sessionError || '', isLoading,
    onRoleChange: changeRole,
    onEmailChange: setEmail,
    onPasswordChange: setPassword,
    onSubmit: submit,
  }
}
