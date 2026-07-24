import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { parentSchema, type ParentFormValues } from '@/validators/usersSchema'
import { validateWithZod } from '@/utils/validateWithZod'

const initialValues: ParentFormValues = {
  lastName: '',
  middleName: '',
  firstName: '',
  profession: '',
  guardianRelation: '',
  phone: '',
  email: '',
  password: '',
}

function InscriptionParentPage() {
  useEffect(() => {
    document.title = 'Inscription Tuteur — Sacré Cœur'
  }, [])

  const navigate = useNavigate()
  // Note: Assurez-vous d'adapter votre fonction de store ou service pour cibler la table 'parents'
  const registerParent = useAuthStore(s => s.registerParent)
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="min-h-screen bg-background grid place-items-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md text-center"
        >
          <div className="size-20 mx-auto rounded-full bg-sacred-red/10 text-sacred-red grid place-items-center mb-6 font-display text-4xl">
            ✓
          </div>
          <h1 className="font-display text-4xl mb-3">
            Inscription enregistrée
          </h1>
          <p className="opacity-70 mb-8 leading-relaxed">
            Votre compte tuteur a été configuré avec succès. Vous pouvez
            maintenant suivre le dossier d'inscription de vos enfants.
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 rounded-full bg-sacred-red text-white font-semibold"
          >
            Retour à l'accueil
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <Link to="/" className="text-sm opacity-60 hover:opacity-100">
            ← Retour
          </Link>
          <h1 className="font-display text-5xl mt-4 mb-2">
            Inscription Parent / Tuteur
          </h1>
          <p className="opacity-60">
            Créez votre compte tuteur pour gérer les inscriptions scolaires de
            vos enfants.
          </p>
        </motion.div>

        <Formik
          initialValues={initialValues}
          validate={validateWithZod(parentSchema)}
          onSubmit={async (values, { setSubmitting, setStatus }) => {
            const fullName =
              `${values.firstName} ${values.middleName} ${values.lastName}`
                .replace(/\s+/g, ' ')
                .trim()

            const result = await registerParent({
              ...values,
              fullName,
            })

            setSubmitting(false)

            if (!result.ok) {
              return setStatus(result.error)
            }

            setSubmitted(true)
            setTimeout(() => navigate('/login'), 4000)
          }}
        >
          {({ isSubmitting, status }) => (
            <Form className="space-y-10">
              <FormSection title="Identité du Responsable / Tuteur">
                <FormGrid>
                  <FormikField name="lastName" label="Nom" />
                  <FormikField name="middleName" label="Postnom" />
                  <FormikField name="firstName" label="Prénom" />
                  <FormikField name="profession" label="Profession" />
                  <FormikField
                    name="guardianRelation"
                    label="Degré de parenté (ex: Père, Mère, Oncle...)"
                  />
                  <FormikField
                    name="phone"
                    label="Numéro de téléphone"
                    type="tel"
                  />
                </FormGrid>
              </FormSection>

              <FormSection title="Identifiants de connexion">
                <FormGrid>
                  <FormikField
                    name="email"
                    label="Adresse Email"
                    type="email"
                  />
                  <FormikField
                    name="password"
                    label="Mot de passe"
                    type="password"
                  />
                </FormGrid>
              </FormSection>

              {status && (
                <div className="px-4 py-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                  {status}
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <p className="text-xs opacity-60">
                  Assurez-vous que vos informations de contact soient valides
                  pour recevoir les alertes scolaires.
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3.5 rounded-full bg-sacred-red text-white font-semibold shadow-lg shadow-sacred-red/20 hover:scale-105 transition-transform disabled:opacity-50"
                >
                  {isSubmitting ? 'Envoi…' : 'Créer'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>

      <style>{`.fk-input { width: 100%; padding: 0.75rem 0.875rem; border-radius: 0.625rem; border: 1px solid var(--color-border); background: var(--color-card); color: var(--color-foreground); font-size: 0.9rem; outline: none; transition: all 0.2s; } .fk-input:focus { border-color: var(--sacred-red); box-shadow: 0 0 0 3px var(--ring); }`}</style>
    </div>
  )
}

function FormSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="p-6 md:p-8 rounded-3xl bg-card border border-border"
    >
      <h2 className="font-display text-2xl mb-6">{title}</h2>
      {children}
    </motion.section>
  )
}

function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>
}

function FormikField({
  name,
  label,
  type = 'text',
}: {
  name: string
  label: string
  type?: string
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-2 block">
        {label}
      </span>
      <Field name={name} type={type} className="fk-input" />
      <ErrorMessage
        name={name}
        component="div"
        className="text-xs text-destructive mt-1"
      />
    </label>
  )
}

export default InscriptionParentPage
