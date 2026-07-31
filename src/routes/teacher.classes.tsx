import { useState, useMemo } from 'react'
import { PageHeader } from '@/components/Dashboard-shell'
import { useAuthStore } from '@/stores/auth-store'
import type { TeacherUser, EleveDetails } from '@/lib/types'
import { useFetchData, useMutateData } from '@/hooks/useQuery'
import { useQueryClient } from '@tanstack/react-query'
import { classService } from '@/services/classe/classe.service'
import { teacherService } from '@/services/teacher/teacher.service'
import { gradeService, type GradeEntry } from '@/services/grade/grade.service'
import { SupabaseErrorHandler } from '@/services/core/Supabase.error.handler'
import { filterElement } from '@/utils/filterElements'
import { ArrowLeft, Loader2, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { getCurrentSchoolYear } from '@/utils/getCurrentSchoolYear'
import { horraireServices } from '@/services/schedule/schedule.service'

function TeacherClasses() {
  const queryClient = useQueryClient()
  const year = getCurrentSchoolYear()
  const [selected, setSelected] = useState<string | null>(null)
  const [selectedIdClasse, setSelectedIdClasse] = useState<string>('')
  const [studentSearchQuery, setStudentSearchQuery] = useState('')

  // --- MODAL BULLETIN ---
  const [gradeModalStudent, setGradeModalStudent] =
    useState<EleveDetails | null>(null)
  const [subject, setSubject] = useState('')
  const [tranche, setTranche] = useState<1 | 2 | 3>(1)
  const [score, setScore] = useState<string>('')
  const [maxScore, setMaxScore] = useState<string>('20')

  const currentUser = useAuthStore(s => s.currentUser) as TeacherUser

  const { data: freshTeacherData, isLoading: isLoadingTeacher } = useFetchData(
    ['teacherProfile', currentUser?.email],
    () => teacherService.getDetailsByEmail(currentUser.email),
    { enabled: !!currentUser?.email }
  )

  const {
    data: allClasses = [],
    isLoading: isLoadingClasses,
    isError: isClassesError,
  } = useFetchData(['classes'], classService.getAllClasses)

  const assignedclasses = useMemo(
    () => freshTeacherData?.assignedclasses || [],
    [freshTeacherData]
  )

  const assignedClasses = useMemo(() => {
    if (!assignedclasses.length || !allClasses) return []
    return allClasses.filter(cls => assignedclasses.includes(cls.id))
  }, [allClasses, assignedclasses])

  const isAuthorized = useMemo(() => {
    if (!selectedIdClasse || !assignedclasses.length) return false
    return assignedclasses.includes(selectedIdClasse)
  }, [selectedIdClasse, assignedclasses])

  const {
    data: studentsData = [],
    isLoading: isLoadingStudents,
    isError: isStudentsError,
  } = useFetchData(
    ['studentClasses', selectedIdClasse],
    () => {
      if (!isAuthorized) throw new Error('Accès non autorisé à cette classe.')
      return classService.getStudentsInClass(selectedIdClasse)
    },
    { enabled: !!selectedIdClasse && isAuthorized }
  )

  const filteredStudents = useMemo(() => {
    return filterElement<EleveDetails>({
      items: studentsData,
      keys: ['lastName', 'firstName'],
      searchQuery: studentSearchQuery,
      selectedValue: 'Tous',
    })
  }, [studentsData, studentSearchQuery])

  const { data: teacherCourses = [], isLoading: isLoadingSubjects } =
    useFetchData(
      ['teacherCourses', freshTeacherData?.fullName, selectedIdClasse],
      () =>
        horraireServices.getTeacherCoursesInClass(
          freshTeacherData!.id,
          selectedIdClasse
        ),
      {
        enabled: !!freshTeacherData?.id && !!selectedIdClasse && isAuthorized,
      }
    )

  const teacherSubjects = useMemo(
    () => teacherCourses.map(c => c.subject),
    [teacherCourses]
  )

  const selectedSubject = subject || teacherSubjects[0] || ''

  // --- RÉCUPÉRATION DE LA NOTE EXISTANTE (pré-remplissage) ---
  const { data: existingGrade, isLoading: isLoadingGrade } = useFetchData(
    ['grade', gradeModalStudent?.id, selectedSubject, tranche],
    () =>
      gradeService.getGrade(
        gradeModalStudent!.id,
        selectedSubject,
        tranche,
        year
      ),
    { enabled: !!gradeModalStudent && !!selectedSubject }
  )

  // Ajustement du formulaire pendant le rendu (pas dans un effect) :
  // pattern officiel React pour resynchroniser un state après un
  // changement de contexte (élève / matière / tranche / arrivée de la
  // donnée async).
  const [prevGradeKey, setPrevGradeKey] = useState<string | null>(null)
  const gradeKey = gradeModalStudent
    ? `${gradeModalStudent.id}|${selectedSubject}|${tranche}|${
        isLoadingGrade ? 'loading' : existingGrade ? 'loaded' : 'empty'
      }`
    : null

  if (gradeKey !== prevGradeKey) {
    setPrevGradeKey(gradeKey)
    if (existingGrade) {
      setScore(String(existingGrade.score))
      setMaxScore(String(existingGrade.max_score))
    } else if (!isLoadingGrade) {
      setScore('')
      setMaxScore('20')
    }
  }

  const saveGradeMutation = useMutateData(
    (entry: GradeEntry) => gradeService.saveGrade(entry),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['grade', gradeModalStudent?.id, selectedSubject, tranche],
        })
        toast.success('Note enregistrée')
      },
      onError: err => SupabaseErrorHandler.handle(err),
    }
  )

  const handleOpenGradeModal = (student: EleveDetails) => {
    setGradeModalStudent(student)
    setSubject('')
    setTranche(1)
  }

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault()
    if (!gradeModalStudent || !currentUser?.id) return
    if (!selectedSubject || !teacherSubjects.includes(selectedSubject)) {
      toast.error("Vous n'êtes pas autorisé à noter cette matière.")
      return
    }

    const numericScore = Number(score)
    const numericMax = Number(maxScore)

    if (Number.isNaN(numericScore) || Number.isNaN(numericMax)) {
      toast.error('Note ou barème invalide.')
      return
    }
    if (numericScore > numericMax) {
      toast.error('La note ne peut pas dépasser le barème.')
      return
    }

    saveGradeMutation.mutate({
      eleve_id: gradeModalStudent.id,
      classe_id: selectedIdClasse,
      teacher_id: currentUser.id,
      subject: selectedSubject,
      tranche,
      score: numericScore,
      max_score: numericMax,
      school_year: year,
    })
  }

  // --- VUE DÉTAILLÉE : LISTE DES ÉLÈVES DE LA CLASSE SÉLECTIONNÉE ---
  if (selected) {
    return isLoadingStudents ? (
      <div className="flex flex-col items-center justify-center py-24 gap-3 opacity-60">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm">Chargement des élèves...</p>
      </div>
    ) : isStudentsError ? (
      <div className="text-center py-12 text-destructive">
        <p className="text-sm">
          Une erreur est survenue lors de la récupération des élèves ou vous
          n'avez pas les droits requis.
        </p>
        <button
          onClick={() => {
            setSelected(null)
            setSelectedIdClasse('')
            setStudentSearchQuery('')
          }}
          className="text-sm underline mt-4 text-foreground opacity-80 hover:opacity-100"
        >
          Retour aux classes
        </button>
      </div>
    ) : (
      <div>
        <button
          onClick={() => {
            setSelected(null)
            setSelectedIdClasse('')
            setStudentSearchQuery('')
          }}
          className="text-sm opacity-60 hover:opacity-100 flex items-center gap-2 mb-4 transition-opacity"
        >
          <ArrowLeft className="size-4" /> Retour aux classes
        </button>

        <PageHeader
          title={selected}
          subtitle={`${filteredStudents.length} élève(s) trouvé(s)`}
        />

        <div className="p-5 rounded-3xl bg-card border border-border mb-6">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 opacity-50" />
            <input
              type="text"
              placeholder="Rechercher un élève par nom, prénom, email..."
              value={studentSearchQuery}
              onChange={e => setStudentSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-2">
          {filteredStudents.map(student => (
            <button
              key={student.id}
              type="button"
              onClick={() => handleOpenGradeModal(student)}
              className="p-4 rounded-2xl bg-card border border-border flex flex-col justify-center text-left hover:border-primary hover:shadow-md transition-all"
            >
              <p className="font-semibold">
                {student.lastName} {student.firstName}
              </p>
              {student.phone && (
                <p className="text-xs opacity-60 font-mono mt-0.5">
                  {student.phone}
                </p>
              )}
            </button>
          ))}

          {filteredStudents.length === 0 && (
            <p className="text-sm opacity-60 text-center py-12 border border-dashed border-border rounded-2xl col-span-full">
              Aucun élève ne correspond à vos critères de recherche.
            </p>
          )}
        </div>

        {/* MODAL : BULLETIN DE SAISIE DE NOTE */}
        {gradeModalStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md p-6 rounded-3xl bg-card border border-border shadow-2xl space-y-4 animate-scale-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold">
                    Saisir une note
                  </h3>
                  <p className="text-xs opacity-60">
                    {gradeModalStudent.lastName} {gradeModalStudent.firstName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGradeModalStudent(null)}
                  className="size-8 rounded-full border border-border grid place-items-center hover:bg-muted transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleSaveGrade}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-widest opacity-70 mb-1 block">
                      Matière
                    </label>
                    {isLoadingSubjects ? (
                      <div className="flex items-center gap-2 py-2.5 text-xs opacity-60">
                        <Loader2 className="size-4 animate-spin text-primary" />
                        <span>Chargement...</span>
                      </div>
                    ) : teacherSubjects.length === 0 ? (
                      <p className="text-xs text-destructive py-2.5">
                        Aucune matière ne vous est attribuée pour cette classe.
                      </p>
                    ) : (
                      <select
                        value={selectedSubject}
                        onChange={e => setSubject(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                      >
                        {teacherSubjects.map(s => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-widest opacity-70 mb-1 block">
                      Tranche
                    </label>
                    <select
                      value={tranche}
                      onChange={e =>
                        setTranche(Number(e.target.value) as 1 | 2 | 3)
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                    >
                      <option value={1}>1ère tranche</option>
                      <option value={2}>2ème tranche</option>
                      <option value={3}>3ème tranche</option>
                    </select>
                  </div>
                </div>

                {isLoadingGrade ? (
                  <div className="flex items-center gap-2 py-2 text-xs opacity-60">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span>Vérification d'une note existante...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs uppercase tracking-widest opacity-70 mb-1 block">
                        Note obtenue
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={score}
                        onChange={e => setScore(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest opacity-70 mb-1 block">
                        Barème
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={maxScore}
                        onChange={e => setMaxScore(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}

                {existingGrade && (
                  <p className="text-xs opacity-50 italic">
                    Une note existe déjà pour cette matière/tranche — elle sera
                    remplacée.
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => setGradeModalStudent(null)}
                    className="px-4 py-2 rounded-full border border-border text-xs font-medium hover:bg-muted transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saveGradeMutation.isPending}
                    className="px-4 py-2 rounded-full bg-sacred-red text-white text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {saveGradeMutation.isPending ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <span>Enregistrer</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  // --- VUE PRINCIPALE : LISTE DES CLASSES ATTRIBUÉES ---
  return (
    <div>
      <PageHeader
        title="Mes classes"
        subtitle="Classes qui vous ont été attribuées pour l'année en cours."
      />

      {isLoadingClasses || isLoadingTeacher ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 opacity-60">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm">Chargement de vos classes...</p>
        </div>
      ) : isClassesError ? (
        <div className="text-center py-12 text-destructive">
          <p className="text-sm">
            Une erreur est survenue lors de la récupération des classes.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignedClasses.map(cls => (
            <div
              key={cls.id}
              onClick={() => {
                setSelected(cls.nom_classe)
                setSelectedIdClasse(cls.id)
              }}
              className="p-6 rounded-3xl bg-card border border-border text-left hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <p className="font-display text-2xl mb-2 group-hover:text-primary transition-colors">
                  {cls.nom_classe}
                </p>
                <p className="text-sm opacity-60">
                  {cls.studentCount || 0} élève{cls.studentCount > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ))}

          {assignedClasses.length === 0 && (
            <div className="col-span-full text-center py-12 border border-dashed border-border rounded-3xl opacity-60">
              <p className="text-sm">
                Aucune classe ne vous a été attribuée pour le moment.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TeacherClasses
