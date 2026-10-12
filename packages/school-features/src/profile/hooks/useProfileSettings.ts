import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import { toast } from 'sonner'
import { useAuthStore } from '@sacre-coeur/auth/stores/auth-store'
import { authService } from '@sacre-coeur/data-access/services/auth/auth.service'
import { getErrorMessage } from '@sacre-coeur/data-access/services/core/Supabase.error.handler'
import { emailSchema, passwordSchema, type EmailFormValues, type PasswordFormValues } from '@sacre-coeur/domain/validators/profilSchema'
import { validateWithZod } from '@sacre-coeur/domain/utils/validateWithZod'

export function useProfileSettings() {
  const navigate = useNavigate()
  const user = useAuthStore(state => state.currentUser)
  const logout = useAuthStore(state => state.logout)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [showDeletePassword, setShowDeletePassword] = useState(false)

  const emailFormik = useFormik<EmailFormValues>({
    initialValues: { email: user?.email ?? '', currentPassword: '' },
    enableReinitialize: true,
    validate: validateWithZod(emailSchema),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await authService.updateEmail(values.email, values.currentPassword)
        toast.success('Un lien de confirmation a été envoyé à votre nouvelle adresse e-mail.')
        resetForm({ values: { ...values, currentPassword: '' } })
      } catch (error) {
        toast.error(getErrorMessage(error))
      } finally {
        setSubmitting(false)
      }
    },
  })

  const passwordFormik = useFormik<PasswordFormValues>({
    initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validate: validateWithZod(passwordSchema),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await authService.updatePassword(values.newPassword, values.currentPassword)
        toast.success('Mot de passe mis à jour avec succès.')
        resetForm()
      } catch (error) {
        toast.error(getErrorMessage(error))
      } finally {
        setSubmitting(false)
      }
    },
  })

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      toast.error('Veuillez saisir votre mot de passe pour confirmer.')
      return
    }
    setIsDeletingAccount(true)
    try {
      await authService.deleteAccount(deletePassword)
      toast.success('Votre compte a été supprimé.')
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsDeletingAccount(false)
      setDeletePassword('')
    }
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setDeletePassword('')
    setShowDeletePassword(false)
  }

  return {
    user, emailFormik, passwordFormik,
    showNewPassword, setShowNewPassword,
    showCurrentPassword, setShowCurrentPassword,
    isDeletingAccount, showDeleteModal, setShowDeleteModal,
    deletePassword, setDeletePassword, showDeletePassword, setShowDeletePassword,
    handleLogout, handleDeleteAccount, closeDeleteModal,
  }
}
