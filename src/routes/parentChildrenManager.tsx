import { useState, type ComponentPropsWithoutRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import { useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Users,
  GraduationCap,
  Loader2,
  ArrowLeft,
  Eye,
} from 'lucide-react'
import { studentSchema, type studentType } from '@/validators/usersSchema'
import { studentService } from '@/services/student/Student.service'
import { useFetchData, useMutateData } from '@/hooks/useQuery'
import type { ClassName, EleveDetails } from '@/lib/types'
import { classService } from '@/services/classe/classe.service'
import StudentProfile from './StudentProfile'
import { inscriptionService } from '@/services/student/inscription.service'
import { getCurrentSchoolYear } from '@/utils/getCurrentSchoolYear'
import { validateWithZod } from '@/utils/validateWithZod'

const initialValues: studentType = {
  lastName: '',
  middleName: '',
  firstName: '',
  birthDate: '',
  birthPlace: '',
  gender: 'M' as const,
  fatherName: '',
  motherName: '',
  fatherProfession: '',
  motherProfession: '',
  childMedicalCondition: '',
  guardianRelation: '',
  phone: '',
  previousSchoolPercentage: 0,
  currentClassName: '',
  previousSchoolName: '',
  religion: 'Catholique',
  address: '',
  province: '',
}

export default function ParentChildrenManager() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<EleveDetails | null>(
    null
  )
  const [selectedStudent, setSelectedStudent] = useState<EleveDetails | null>(
    null
  )

  // 1. Fetch de la liste réelle des enfants
  const { data: childrenList = [], isLoading } = useFetchData<EleveDetails[]>(
    ['students', 'parent-list'],
    () => studentService.getStudentsByParent()
  )
  // 1. Fetch de la liste réelle des classes
  const { data: classes = [] } = useFetchData<ClassName[]>(['classes'], () =>
    classService.getAllClasses()
  )

  // 2. Mutations React Query
  const createMutation = useMutateData(
    async (
      values: Omit<EleveDetails, 'id' | 'status' | 'classe_id' | 'parent_id'>
    ) => {
      const newStudent = await studentService.createStudent(values)

      if (values.currentClassName) {
        await inscriptionService.createInscription({
          eleveId: newStudent.id,
          classeId: newStudent.currentClassName,
          anneeScolaire: getCurrentSchoolYear(),
        })
      }
      return newStudent
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['students', 'parent-list'] })
        queryClient.invalidateQueries({ queryKey: ['inscriptions'] })
        setIsModalOpen(false)
      },
    }
  )

  const updateMutation = useMutateData(
    ({
      id,
      values,
    }: {
      id: string
      values: Omit<EleveDetails, 'id' | 'status' | 'classe_id' | 'parent_id'>
    }) => studentService.updateStudent(id, values),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['students', 'parent-list'] })
        setIsModalOpen(false)
      },
    }
  )

  const deleteMutation = useMutateData(
    (id: string) => studentService.deleteStudent(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['students', 'parent-list'] })
      },
    }
  )

  const handleCloseModal = () => {
    setEditingStudent(null)
    setIsModalOpen(false)
  }

  if (selectedStudent) {
    return (
      <div className="space-y-4">
        {/* Bouton retour pour réinitialiser l'état */}
        <button
          onClick={() => setSelectedStudent(null)}
          className="flex items-center gap-2 text-sm font-medium text-sacred-red hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="size-4" /> Retour à la liste des élèves
        </button>

        {/* Le profil de l'élève lié */}
        <StudentProfile student={selectedStudent} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* SECTION TITRE & ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl bg-card border border-border">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-sacred-red/10 text-sacred-red grid place-items-center shrink-0">
            <Users className="size-6" />
          </div>
          <div>
            <h2 className="font-display text-2xl">Mes enfants inscrits</h2>
            <p className="text-sm opacity-60">
              Greéz le dossier scolaire de vos enfants.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingStudent(null)
            setIsModalOpen(true)
          }}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-sacred-red text-white text-sm font-semibold shadow-lg shadow-sacred-red/20 hover:scale-105 transition-transform"
        >
          <Plus className="size-4" /> Inscrire un enfant
        </button>
      </div>

      {/* GESTION DE L'AFFICHAGE DU CHARGEMENT */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-sacred-red" />
        </div>
      ) : childrenList.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-3xl opacity-60">
          <p className="text-sm">Aucun enfant n'est inscrit pour le moment.</p>
        </div>
      ) : (
        /* LISTE DES ENFANTS */
        <div className="grid sm:grid-cols-2 gap-4">
          {childrenList.map(child => {
            const currentClassObj = classes.find(
              cls => cls.id === child.currentClassName
            )
            const currentClassNameString = currentClassObj
              ? currentClassObj.nom_classe
              : child.currentClassName
            return (
              <div
                key={child.id}
                className="p-6 rounded-3xl bg-card border border-border flex items-center justify-between gap-4 hover:shadow-lg transition-all"
              >
                <div className="space-y-1">
                  <p className="font-display text-xl text-foreground">
                    {child.firstName} {child.middleName} {child.lastName}
                  </p>
                  <div className="flex items-center gap-2 text-xs opacity-60">
                    <GraduationCap className="size-3.5" />
                    <span>Classe : {currentClassNameString}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedStudent(child)}
                    className="p-2.5 rounded-xl bg-muted/40 hover:bg-muted text-foreground/80 hover:text-foreground transition-colors"
                    title="voir le profil"
                  >
                    <Eye className="size-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingStudent(child)
                      setIsModalOpen(true)
                    }}
                    className="p-2.5 rounded-xl bg-muted/40 hover:bg-muted text-foreground/80 hover:text-foreground transition-colors"
                    title="Modifier"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (
                        confirm('Voulez-vous vraiment retirer ce dossier ?')
                      ) {
                        deleteMutation.mutate(child.id)
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="p-2.5 rounded-xl bg-destructive/10 hover:bg-destructive text-destructive hover:text-white transition-colors disabled:opacity-50"
                    title="Supprimer"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL DE FORMULAIRE */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-background/80 backdrop-blur-sm grid place-items-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-card border border-border rounded-4xl shadow-2xl overflow-hidden"
            >
              {/* Header du Modal */}
              <div className="p-6 md:p-8 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-display text-3xl">
                    {editingStudent ? "Modifier l'élève" : 'Inscrire un enfant'}
                  </h3>
                  <p className="text-sm opacity-60 mt-1">
                    {editingStudent
                      ? 'Mettez à jour les informations du dossier scolaire.'
                      : 'Remplissez ce formulaire pour ajouter un nouvel enfant.'}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="size-6" />
                </button>
              </div>

              {/* Formulaire Défilable */}
              <div className="p-6 md:p-8 max-h-[70vh] overflow-y-auto">
                <Formik
                  initialValues={editingStudent || initialValues}
                  enableReinitialize
                  validate={validateWithZod(studentSchema)}
                  onSubmit={values => {
                    if (editingStudent) {
                      updateMutation.mutate({ id: editingStudent.id, values })
                    } else {
                      createMutation.mutate(values)
                    }
                  }}
                >
                  {({ isSubmitting }) => (
                    <Form className="space-y-8">
                      {/* Section Identité */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-sacred-red text-xs uppercase tracking-widest">
                          Identité de l'enfant
                        </h4>
                        <FormGrid>
                          <FormikField
                            name="lastName"
                            label="Nom"
                            disabled={isSubmitting}
                          />
                          <FormikField
                            name="middleName"
                            label="Postnom"
                            disabled={isSubmitting}
                          />
                          <FormikField
                            name="firstName"
                            label="Prénom"
                            disabled={isSubmitting}
                          />
                          <FormikField
                            name="birthDate"
                            label="Date de naissance"
                            type="date"
                            disabled={isSubmitting}
                          />
                          <FormikField
                            name="birthPlace"
                            label="Lieu de naissance"
                            disabled={isSubmitting}
                          />
                          <FormikSelect
                            name="gender"
                            label="Sexe"
                            options={[
                              { value: 'M', label: 'Masculin' },
                              { value: 'F', label: 'Féminin' },
                            ]}
                          />
                        </FormGrid>
                      </div>

                      {/* Section Parents */}
                      <div className="space-y-4 pt-6 border-t border-border/60">
                        <h4 className="font-semibold text-sacred-red text-xs uppercase tracking-widest">
                          Parents & Tuteurs
                        </h4>
                        <FormGrid>
                          <FormikField
                            name="fatherName"
                            label="Nom du père"
                            disabled={isSubmitting}
                          />
                          <FormikField
                            name="motherName"
                            label="Nom de la mère"
                            disabled={isSubmitting}
                          />
                          <FormikField
                            name="fatherProfession"
                            label="Profession du père"
                            disabled={isSubmitting}
                          />
                          <FormikField
                            name="motherProfession"
                            label="Profession de la mère"
                            disabled={isSubmitting}
                          />
                          <FormikField
                            name="guardianRelation"
                            label="Degré de parenté"
                            disabled={isSubmitting}
                          />
                          <FormikField
                            name="phone"
                            label="Numéro de téléphone"
                            disabled={isSubmitting}
                          />
                        </FormGrid>
                        <div className="mt-4">
                          <FormikField
                            name="childMedicalCondition"
                            label="L'enfant souffre de (facultatif)"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      {/* Section Scolarité */}
                      <div className="space-y-4 pt-6 border-t border-border/60">
                        <h4 className="font-semibold text-sacred-red text-xs uppercase tracking-widest">
                          Scolarité
                        </h4>
                        <FormGrid>
                          <FormikSelect
                            name="currentClassName"
                            label="Classe actuelle"
                            options={classes.map(cl => ({
                              value: cl.id,
                              label: cl.nom_classe,
                            }))}
                          />
                          <FormikField
                            name="previousSchoolName"
                            label="École de provenance"
                            disabled={isSubmitting}
                          />
                          <FormikField
                            name="previousSchoolPercentage"
                            label="Pourcentage école précédente"
                            type="number"
                            disabled={isSubmitting}
                          />
                        </FormGrid>
                      </div>

                      {/* Section Adresse & Religion */}
                      <div className="space-y-4 pt-6 border-t border-border/60">
                        <h4 className="font-semibold text-sacred-red text-xs uppercase tracking-widest">
                          Adresse & Réligion
                        </h4>
                        <FormGrid>
                          <FormikField
                            name="address"
                            label="Adresse"
                            disabled={isSubmitting}
                          />
                          <FormikField
                            name="province"
                            label="Province"
                            disabled={isSubmitting}
                          />
                          <FormikField
                            name="religion"
                            label="Religion"
                            disabled={isSubmitting}
                          />
                        </FormGrid>
                      </div>

                      {/* Pied de formulaire */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-border">
                        <p className="text-xs opacity-60 max-w-sm">
                          Toutes les modifications ou ajouts restent soumis à la
                          validation finale de l'administration.
                        </p>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={handleCloseModal}
                            className="px-6 py-3 rounded-full border border-border text-sm font-semibold hover:bg-muted transition-colors"
                          >
                            Annuler
                          </button>
                          <button
                            type="submit"
                            disabled={
                              createMutation.isPending ||
                              updateMutation.isPending
                            }
                            className="px-8 py-3.5 rounded-full bg-sacred-red text-white font-semibold shadow-lg shadow-sacred-red/20 hover:scale-105 transition-transform disabled:opacity-50"
                          >
                            {createMutation.isPending ||
                            updateMutation.isPending
                              ? 'Enregistrement...'
                              : editingStudent
                                ? 'Enregistrer'
                                : "Créer l'enfant"}
                          </button>
                        </div>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .fk-input { 
          width: 100%; 
          padding: 0.75rem 0.875rem; 
          border-radius: 0.625rem; 
          border: 1px solid var(--color-border); 
          background: var(--color-card); 
          color: var(--color-foreground); 
          font-size: 0.9rem; 
          outline: none; 
          transition: all 0.2s; 
        } 
        .fk-input:focus { 
          border-color: var(--sacred-red); 
          box-shadow: 0 0 0 3px var(--ring); 
        }
      `}</style>
    </div>
  )
}

function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>
}

interface FormikFieldProps extends ComponentPropsWithoutRef<'input'> {
  name: string
  label: string
}

function FormikField({
  name,
  label,
  type = 'text',
  ...props
}: FormikFieldProps) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-2 block">
        {label}
      </span>
      <Field
        name={name}
        type={type}
        className="fk-input disabled:cursor-not-allowed disabled:opacity-60"
        {...props}
      />
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
  options: Array<{ value: string; label: string }>
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-2 block">
        {label}
      </span>
      <Field name={name} as="select" className="fk-input">
        <option value="">Sélectionnez une option</option>
        {options?.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
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
