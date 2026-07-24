import { useState } from 'react'
import { PageHeader } from '@/components/Dashboard-shell'
import {
  Mail,
  Lock,
  Trash2,
  LogOut,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'

import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/supabase/supabaseClient'
import { SupabaseErrorHandler } from '@/services/core/Supabase.error.handler'
import { toast } from 'sonner'
import {
  emailSchema,
  passwordSchema,
  type EmailFormValues,
  type PasswordFormValues,
} from '@/validators/profilSchema'
import { validateWithZod } from '@/utils/validateWithZod'

export default function UserProfileSettings() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.currentUser)

  // UI States
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Formulaire 1 : Email
  const emailFormik = useFormik<EmailFormValues>({
    initialValues: {
      email: user?.email || '',
    },
    enableReinitialize: true,
    validate: validateWithZod(emailSchema),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const { error } = await supabase.auth.updateUser({
          email: values.email,
        })
        if (error) throw error
        toast.success(
          'Un lien de confirmation a été envoyé à votre nouvelle adresse e-mail.'
        )
      } catch (err) {
        const message = SupabaseErrorHandler.handle(err)
        toast.error(message)
      } finally {
        setSubmitting(false)
      }
    },
  })

  // Formulaire 2 : Mot de passe
  const passwordFormik = useFormik<PasswordFormValues>({
    initialValues: {
      newPassword: '',
      confirmPassword: '',
    },
    validate: validateWithZod(passwordSchema),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const { error } = await supabase.auth.updateUser({
          password: values.newPassword,
        })
        if (error) throw error
        toast.success('Mot de passe mis à jour avec succès.')
        resetForm()
      } catch (err) {
        const message = SupabaseErrorHandler.handle(err)
        toast.error(message)
      } finally {
        setSubmitting(false)
      }
    },
  })

  // Action : Déconnexion
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      navigate('/login')
    } catch (err) {
      const message = SupabaseErrorHandler.handle(err)
      toast.error(message)
    }
  }

  // Action : Suppression du compte
  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true)
    try {
      const { error } = await supabase.rpc('delete_user_account')
      if (error) throw error

      await supabase.auth.signOut()
      toast.success('Votre compte a été supprimé.')
      navigate('/login')
    } catch (err) {
      const message = SupabaseErrorHandler.handle(err)
      toast.error(message)
      setIsDeletingAccount(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
      <PageHeader
        title="Paramètres du profil"
        subtitle="Gérez vos informations personnelles, votre sécurité et l'accès à votre compte."
      />

      {/* Carte 1 : Modification de l'email */}
      <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border border-border space-y-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-sacred-red/10 text-sacred-red grid place-items-center">
            <Mail className="size-5" />
          </div>
          <div>
            <h2 className="font-display text-base sm:text-lg font-bold">
              Adresse E-mail
            </h2>
            <p className="text-xs opacity-60">
              Modifiez votre adresse e-mail de connexion.
            </p>
          </div>
        </div>

        <form onSubmit={emailFormik.handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-medium opacity-70">
              Nouvelle adresse e-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={emailFormik.values.email}
              onChange={emailFormik.handleChange}
              onBlur={emailFormik.handleBlur}
              className={`w-full px-4 py-2.5 rounded-2xl bg-muted/40 border transition-all text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sacred-red/20 ${
                emailFormik.touched.email && emailFormik.errors.email
                  ? 'border-destructive'
                  : 'border-border'
              }`}
              placeholder="votre.email@exemple.com"
            />
            {emailFormik.touched.email && emailFormik.errors.email && (
              <p className="text-xs text-destructive font-medium">
                {emailFormik.errors.email}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={
              emailFormik.isSubmitting ||
              emailFormik.values.email === user?.email ||
              !emailFormik.isValid
            }
            className="px-5 py-2.5 rounded-xl bg-sacred-red hover:bg-sacred-red/90 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {emailFormik.isSubmitting && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Mettre à jour l'email
          </button>
        </form>
      </div>

      {/* Carte 2 : Sécurité / Mot de passe */}
      <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border border-border space-y-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-sacred-gold/20 text-sacred-gold grid place-items-center">
            <Lock className="size-5" />
          </div>
          <div>
            <h2 className="font-display text-base sm:text-lg font-bold">
              Mot de passe
            </h2>
            <p className="text-xs opacity-60">
              Renforcez la sécurité de votre compte avec un mot de passe solide.
            </p>
          </div>
        </div>

        <form onSubmit={passwordFormik.handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nouveau mot de passe */}
            <div className="space-y-1.5">
              <label
                htmlFor="newPassword"
                className="text-xs font-medium opacity-70"
              >
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordFormik.values.newPassword}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  className={`w-full px-4 py-2.5 pr-10 rounded-2xl bg-muted/40 border transition-all text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sacred-gold/20 ${
                    passwordFormik.touched.newPassword &&
                    passwordFormik.errors.newPassword
                      ? 'border-destructive'
                      : 'border-border'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {showNewPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {passwordFormik.touched.newPassword &&
                passwordFormik.errors.newPassword && (
                  <p className="text-xs text-destructive font-medium">
                    {passwordFormik.errors.newPassword}
                  </p>
                )}
            </div>

            {/* Confirmer le mot de passe */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="text-xs font-medium opacity-70"
              >
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordFormik.values.confirmPassword}
                onChange={passwordFormik.handleChange}
                onBlur={passwordFormik.handleBlur}
                className={`w-full px-4 py-2.5 rounded-2xl bg-muted/40 border transition-all text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sacred-gold/20 ${
                  passwordFormik.touched.confirmPassword &&
                  passwordFormik.errors.confirmPassword
                    ? 'border-destructive'
                    : 'border-border'
                }`}
                placeholder="••••••••"
              />
              {passwordFormik.touched.confirmPassword &&
                passwordFormik.errors.confirmPassword && (
                  <p className="text-xs text-destructive font-medium">
                    {passwordFormik.errors.confirmPassword}
                  </p>
                )}
            </div>
          </div>

          <button
            type="submit"
            disabled={
              passwordFormik.isSubmitting ||
              !passwordFormik.values.newPassword ||
              !passwordFormik.isValid
            }
            className="px-5 py-2.5 rounded-xl bg-card border border-border hover:bg-muted text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {passwordFormik.isSubmitting && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Modifier le mot de passe
          </button>
        </form>
      </div>

      {/* Carte 3 : Session & Zone Dangereuse */}
      <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border border-border space-y-6">
        {/* Déconnexion */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <h3 className="font-display text-sm sm:text-base font-bold flex items-center gap-2">
              <LogOut className="size-4 text-amber-500" />
              Déconnexion
            </h3>
            <p className="text-xs opacity-60">
              Déconnectez votre session sur cet appareil.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="size-4" /> Se déconnecter
          </button>
        </div>

        {/* Suppression du compte */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-sm sm:text-base font-bold text-destructive flex items-center gap-2">
              <Trash2 className="size-4" />
              Supprimer le compte
            </h3>
            <p className="text-xs opacity-60">
              Cette action est définitive et effacera l'ensemble de vos données.
            </p>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Trash2 className="size-4" /> Supprimer le compte
          </button>
        </div>
      </div>

      {/* Modale de Confirmation de Suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4">
          <div className="bg-card border border-border rounded-2xl sm:rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="size-12 rounded-full bg-destructive/10 text-destructive grid place-items-center mx-auto">
              <AlertTriangle className="size-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-display text-lg font-bold">
                Êtes-vous absolument sûr ?
              </h3>
              <p className="text-xs opacity-60 leading-relaxed">
                Cette action est irréversible. Toutes vos données enregistrées
                seront définitivement supprimées.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs sm:text-sm font-semibold hover:bg-muted transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-xs sm:text-sm font-semibold hover:bg-destructive/90 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeletingAccount && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
