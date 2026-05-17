import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { ALL_CLASS_NAMES } from '@/lib/mock-seed'
import type { SchoolClassName } from '@/lib/types'

const studentSchema = z.object({
  lastName: z.string().trim().min(1, 'Requis').max(60),
  middleName: z.string().trim().max(60),
  firstName: z.string().trim().min(1, 'Requis').max(60),
  birthDate: z.string().min(1, 'Requis'),
  birthPlace: z.string().trim().min(1, 'Requis').max(80),
  gender: z.enum(['M', 'F']),
  fatherName: z.string().trim().min(1, 'Requis').max(80),
  motherName: z.string().trim().min(1, 'Requis').max(80),
  fatherProfession: z.string().trim().min(1, 'Requis').max(80),
  motherProfession: z.string().trim().min(1, 'Requis').max(80),
  childMedicalCondition: z.string().trim().max(200),
  guardianRelation: z.string().trim().min(1, 'Requis').max(40),
  phone: z.string().trim().min(6, 'Requis').max(20),
  email: z.string().trim().email('Email invalide'),
  password: z.string().min(6, 'Min. 6 caractères'),
  previousSchoolPercentage: z.coerce.number().min(0).max(100),
  currentClassName: z.string().min(1, 'Requis'),
  previousSchoolName: z.string().trim().min(1, 'Requis').max(100),
  religion: z.string().trim().min(1, 'Requis').max(40),
  address: z.string().trim().min(1, 'Requis').max(120),
  province: z.string().trim().min(1, 'Requis').max(60),
})

type StudentFormValues = z.infer<typeof studentSchema>

const initialValues: StudentFormValues = {
  lastName: '',
  middleName: '',
  firstName: '',
  birthDate: '',
  birthPlace: '',
  gender: 'M',
  fatherName: '',
  motherName: '',
  fatherProfession: '',
  motherProfession: '',
  childMedicalCondition: '',
  guardianRelation: '',
  phone: '',
  email: '',
  password: '',
  previousSchoolPercentage: 0,
  currentClassName: '1ère Secondaire',
  previousSchoolName: '',
  religion: 'Catholique',
  address: '',
  province: '',
}

function InscriptionPage() {
  useEffect(() => {
    document.title = 'Inscription — Sacré Cœur'
  }, [])

  const navigate = useNavigate()
  const registerStudent = useAuthStore(s => s.registerStudent)
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
            Votre dossier a été transmis à l'administration. Vous recevrez un
            email une fois votre compte validé.
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
          <h1 className="font-display text-5xl mt-4 mb-2">Inscription élève</h1>
          <p className="opacity-60">
            Remplissez ce formulaire. Votre dossier sera validé par
            l'administration.
          </p>
        </motion.div>

        <Formik
          initialValues={initialValues}
          validate={values => {
            const result = studentSchema.safeParse(values)
            if (result.success) return {}
            const errors: Record<string, string> = {}
            for (const issue of result.error.issues) {
              const key = issue.path.join('.')
              if (!errors[key]) errors[key] = issue.message
            }
            return errors
          }}
          onSubmit={(values, { setSubmitting, setStatus }) => {
            const fullName =
              `${values.firstName} ${values.middleName} ${values.lastName}`
                .replace(/\s+/g, ' ')
                .trim()
            const result = registerStudent({
              ...values,
              fullName,
              currentClassName: values.currentClassName as SchoolClassName,
            })
            setSubmitting(false)
            if (!result.ok) return setStatus(result.error)
            setSubmitted(true)
            setTimeout(() => navigate('/login'), 4000)
          }}
        >
          {({ isSubmitting, status }) => (
            <Form className="space-y-10">
              <FormSection title="Identité de l'enfant">
                <FormGrid>
                  <FormikField name="lastName" label="Nom" />
                  <FormikField name="middleName" label="Postnom" />
                  <FormikField name="firstName" label="Prénom" />
                  <FormikField
                    name="birthDate"
                    label="Date de naissance"
                    type="date"
                  />
                  <FormikField name="birthPlace" label="Lieu de naissance" />
                  <FormikSelect
                    name="gender"
                    label="Sexe"
                    options={[
                      ['M', 'Masculin'],
                      ['F', 'Féminin'],
                    ]}
                  />
                </FormGrid>
              </FormSection>

              <FormSection title="Parents & Tuteurs">
                <FormGrid>
                  <FormikField name="fatherName" label="Nom du père" />
                  <FormikField name="motherName" label="Nom de la mère" />
                  <FormikField
                    name="fatherProfession"
                    label="Profession du père"
                  />
                  <FormikField
                    name="motherProfession"
                    label="Profession de la mère"
                  />
                  <FormikField
                    name="guardianRelation"
                    label="Degré de parenté du tuteur"
                  />
                  <FormikField name="phone" label="Numéro de téléphone" />
                </FormGrid>
                <div className="mt-4">
                  <FormikField
                    name="childMedicalCondition"
                    label="L'enfant souffre de (facultatif)"
                  />
                </div>
              </FormSection>

              <FormSection title="Scolarité">
                <FormGrid>
                  <FormikSelect
                    name="currentClassName"
                    label="Classe actuelle"
                    options={ALL_CLASS_NAMES.map(c => [c, c])}
                  />
                  <FormikField
                    name="previousSchoolName"
                    label="École de provenance"
                  />
                  <FormikField
                    name="previousSchoolPercentage"
                    label="Pourcentage école précédente"
                    type="number"
                  />
                  <FormikField name="religion" label="Religion" />
                </FormGrid>
              </FormSection>

              <FormSection title="Adresse & Compte">
                <FormGrid>
                  <FormikField name="address" label="Adresse" />
                  <FormikField name="province" label="Province" />
                  <FormikField name="email" label="Email" type="email" />
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
                  Votre compte sera activé après validation par
                  l'administration.
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3.5 rounded-full bg-sacred-red text-white font-semibold shadow-lg shadow-sacred-red/20 hover:scale-105 transition-transform disabled:opacity-50"
                >
                  {isSubmitting ? 'Envoi…' : "Soumettre l'inscription"}
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

function FormikSelect({
  name,
  label,
  options,
}: {
  name: string
  label: string
  options: [string, string][]
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-2 block">
        {label}
      </span>
      <Field name={name} as="select" className="fk-input">
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </Field>
      <ErrorMessage
        name={name}
        component="div"
        className="text-xs text-destructive mt-1"
      />
    </label>
  )
}

export default InscriptionPage
