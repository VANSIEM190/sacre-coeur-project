import { useState } from 'react'
import { PageHeader } from '@/components/Dashboard-shell'
import { useAuthStore } from '@/stores/auth-store'
import type { TeacherUser, StudentUser } from '@/lib/types'
import { useFetchData } from '@/hooks/useQuery'
import { classService } from '@/services/classe/classe.service'
import { filterElement } from '@/utils/filterElements'

function TeacherClasses() {
  // 1. États pour la gestion de la classe sélectionnée et de la recherche
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // 2. On récupère toutes les classes
  const { data: allClasses = [], isLoading: isLoadingClasses } = useFetchData(
    ['classes'],
    () => classService.getAllClasses()
  )

  // 3. On récupère le profil de l'enseignant connecté
  const teacher = useAuthStore(s => s.currentUser) as TeacherUser
  console.log(teacher.assignedclasses)

  // 4. Filtrage automatique des classes attribuées à l'enseignant
  const assignedClasses =
    teacher?.assignedclasses && allClasses
      ? allClasses.filter(cls => teacher.assignedclasses.includes(cls.id))
      : []

  // 5. SÉCURITÉ : On ne charge les élèves que si la classe cliquée appartient bien à l'enseignant
  const isAuthorized = selectedClassId
    ? teacher?.assignedclasses?.includes(selectedClassId)
    : false

  const { data: students = [], isLoading: isLoadingStudents } = useFetchData(
    ['students', selectedClassId],
    () => classService.getStudentsInClass(selectedClassId!),
    {
      enabled: !!selectedClassId && isAuthorized, // N'exécute la requête que si l'accès est vérifié
    }
  )

  // 6. Application de ta fonction filterElement sur les élèves récupérés
  const filteredStudents = filterElement<StudentUser>({
    items: students,
    keys: ['lastName', 'firstName', 'email'], // Propriétés définies dans ton interface StudentClassList / StudentUser
    searchQuery: searchQuery,
    selectedValue: 'Tous',
  })

  if (isLoadingClasses) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Chargement de vos classes...
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Mes classes"
        subtitle="Classes qui vous ont été attribuées."
      />
      <div className="space-y-6">
        {assignedClasses.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucune classe ne vous a été attribuée.
          </p>
        ) : (
          assignedClasses.map(cls => {
            const isCurrentClassSelected = selectedClassId === cls.id

            return (
              <div
                key={cls.id}
                className="p-6 rounded-3xl bg-card border border-border"
              >
                {/* Entête de la carte : Cliquable pour ouvrir/fermer la liste des élèves */}
                <div
                  className="cursor-pointer select-none"
                  onClick={() =>
                    setSelectedClassId(isCurrentClassSelected ? null : cls.id)
                  }
                >
                  <p className="font-display text-2xl mb-4 hover:opacity-80 transition-opacity">
                    {cls.nom_classe}
                    <span className="text-sm opacity-50 ml-2">
                      ({cls.studentCount} élèves)
                    </span>
                  </p>
                </div>

                {/* Contenu de la classe active */}
                {isCurrentClassSelected && (
                  <div className="mt-4 space-y-4 pt-4 border-t border-border">
                    {/* Input de filtrage / recherche */}
                    <div className="max-w-md">
                      <input
                        type="text"
                        placeholder="Rechercher un élève par nom, prénom ou email..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    {/* Affichage pendant le chargement des élèves */}
                    {isLoadingStudents ? (
                      <p className="text-sm text-muted-foreground animate-pulse">
                        Chargement de la liste des élèves...
                      </p>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-2">
                        {filteredStudents.length === 0 ? (
                          <p className="text-sm text-muted-foreground col-span-2 py-2">
                            Aucun élève ne correspond à votre recherche.
                          </p>
                        ) : (
                          filteredStudents.map(student => (
                            <div
                              key={student.id}
                              className="p-3 rounded-xl bg-background border border-border text-sm flex flex-col"
                            >
                              <span className="font-medium">
                                {student.lastName} {student.firstName}
                              </span>
                              {student.email && (
                                <span className="text-xs opacity-60 font-mono mt-0.5">
                                  {student.email}
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Pied de carte par défaut */}
                {!isCurrentClassSelected && (
                  <div className="grid sm:grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-background border border-border text-sm text-muted-foreground">
                      ID de la classe :{' '}
                      <span className="font-mono text-xs text-foreground">
                        {cls.id}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default TeacherClasses
