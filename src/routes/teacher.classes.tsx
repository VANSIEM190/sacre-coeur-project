import { useState, useMemo } from 'react'
import { PageHeader } from '@/components/Dashboard-shell'
import { useAuthStore } from '@/stores/auth-store'
import type { TeacherUser, StudentUser } from '@/lib/types'
import { useFetchData } from '@/hooks/useQuery'
import { classService } from '@/services/classe/classe.service'
import { filterElement } from '@/utils/filterElements'
import { ArrowLeft, Loader2, Search } from 'lucide-react'

function TeacherClasses() {
  // Écrans et sélection de classes (Design calqué sur AdminClasses)
  const [selected, setSelected] = useState<string | null>(null)
  const [selectedIdClasse, setSelectedIdClasse] = useState<string>('')
  const [studentSearchQuery, setStudentSearchQuery] = useState('')

  // 1. REQUÊTE : On récupère toutes les classes
  const {
    data: allClasses = [],
    isLoading: isLoadingClasses,
    isError: isClassesError,
  } = useFetchData(['classes'], classService.getAllClasses)

  // 2. AUTH : On récupère le profil de l'enseignant connecté
  const teacher = useAuthStore(s => s.currentUser) as TeacherUser

  // 3. FILTRAGE : Classes attribuées à l'enseignant
  const assignedClasses = useMemo(() => {
    if (!teacher?.assignedclasses || !allClasses) return []
    return allClasses.filter(cls => teacher.assignedclasses.includes(cls.id))
  }, [allClasses, teacher])

  // 4. SÉCURITÉ : Vérification d'habilitation stricte côté client
  const isAuthorized = useMemo(() => {
    if (!selectedIdClasse || !teacher?.assignedclasses) return false
    return teacher.assignedclasses.includes(selectedIdClasse)
  }, [selectedIdClasse, teacher])

  // 5. REQUÊTE : Récupération sécurisée des élèves de la classe sélectionnée
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
    {
      enabled: !!selectedIdClasse && isAuthorized,
    }
  )

  // 6. FILTRAGE TEXTUEL : Application de filterElement sur les élèves
  const filteredStudents = useMemo(() => {
    return filterElement<StudentUser>({
      items: studentsData,
      keys: ['lastName', 'firstName'],
      searchQuery: studentSearchQuery,
      selectedValue: 'Tous',
    })
  }, [studentsData, studentSearchQuery])

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

        {/* Zone de recherche / filtrage des élèves */}
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

        {/* Liste des élèves filtrés */}
        <div className="grid sm:grid-cols-2 gap-2">
          {filteredStudents.map(student => (
            <div
              key={student.id}
              className="p-4 rounded-2xl bg-card border border-border flex flex-col justify-center"
            >
              <p className="font-semibold">
                {student.lastName} {student.firstName}
              </p>
              {student.phone && (
                <p className="text-xs opacity-60 font-mono mt-0.5">
                  {student.phone}
                </p>
              )}
            </div>
          ))}

          {filteredStudents.length === 0 && (
            <p className="text-sm opacity-60 text-center py-12 border border-dashed border-border rounded-2xl col-span-full">
              Aucun élève ne correspond à vos critères de recherche.
            </p>
          )}
        </div>
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

      {isLoadingClasses ? (
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

              <div className="mt-4 pt-3 border-t border-border/50 text-[11px] font-mono opacity-40 group-hover:opacity-70 transition-opacity">
                ID : {cls.id}
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
