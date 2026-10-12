import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { FormikHelpers } from 'formik'
import { useAuthStore } from '@sacre-coeur/auth/stores/auth-store'
import { parentService } from '@sacre-coeur/data-access/services/parent/parent.service'
import { getErrorMessage } from '@sacre-coeur/data-access/services/core/Supabase.error.handler'
import type { ParentFormValues } from '@sacre-coeur/domain/validators/usersSchema'

export function useParentRegistration() {
  const navigate = useNavigate()
  const logout = useAuthStore(state => state.logout)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!submitted) return
    const timer = setTimeout(() => navigate('/login'), 4000)
    return () => clearTimeout(timer)
  }, [navigate, submitted])

  const submit = async (values: ParentFormValues, { setSubmitting, setStatus }: FormikHelpers<ParentFormValues>) => {
    setStatus(undefined)
    // signUp can create a temporary session before the parent details exist.
    // The registration result must be known before publishing an identity.
    useAuthStore.setState({ isAuthenticating: true })
    try {
      await parentService.register(values)
      await logout()
      setSubmitted(true)
    } catch (error) {
      setStatus(getErrorMessage(error))
      try { await logout() } catch { /* Preserve the registration error. */ }
    } finally {
      useAuthStore.setState({ isAuthenticating: false })
      setSubmitting(false)
    }
  }

  return { submitted, submit }
}
