import { useState, useMemo } from 'react'
import { PageHeader } from '@/components/Dashboard-shell'
import { useAuthStore } from '@/stores/auth-store'
import { useFetchData } from '@/hooks/useQuery'
import { classService } from '@/services/classe/classe.service'
import { horraireServices } from '@/services/schedule/schedule.service'
import type { ScheduleEntry, ClassName, TeacherUser } from '@/lib/types'
import { ArrowLeft, Search, Download, Loader2 } from 'lucide-react'
import jsPDF from 'jspdf'

const DAYS: ScheduleEntry['dayOfWeek'][] = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
]

function TeacherHoraires() {
  // 1. Récupération de l'enseignant connecté depuis le store d'authentification
  const teacher = useAuthStore(s => s.currentUser) as TeacherUser

  // Récupération sécurisée du tableau des IDs de classes assignées
  const assignedClassIds = useMemo(() => {
    return teacher?.assignedclasses ?? []
  }, [teacher])

  // États pour la navigation et la recherche
  const [selectedClass, setSelectedClass] = useState<ClassName | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // 2. Chargement de TOUTES les classes de l'école
  const { data: allClasses = [], isLoading: isLoadingClasses } = useFetchData<
    ClassName[]
  >(['classes'], classService.getAllClasses)

  // 3. Filtrage des classes : Uniquement celles enseignées par le professeur connecté
  const myClasses = useMemo(() => {
    return allClasses.filter(c => assignedClassIds.includes(c.id))
  }, [allClasses, assignedClassIds])

  // 4. Chargement de l'emploi du temps de la classe sélectionnée uniquement
  const { data: schedule = [], isLoading: isLoadingSchedule } = useFetchData<
    ScheduleEntry[]
  >(
    ['schedule', selectedClass?.id],
    () => horraireServices.getSchedule(selectedClass?.id || ''),
    { enabled: !!selectedClass?.id }
  )

  // 5. Filtrage dynamique par mot-clé (Matière, Local, Jour, Enseignant)
  const filteredSchedule = useMemo(() => {
    return schedule.filter(s => {
      const searchLower = searchQuery.toLowerCase()
      return (
        s.subject.toLowerCase().includes(searchLower) ||
        s.room.toLowerCase().includes(searchLower) ||
        s.dayOfWeek.toLowerCase().includes(searchLower) ||
        (s.teacherName && s.teacherName.toLowerCase().includes(searchLower))
      )
    })
  }, [schedule, searchQuery])

  // 6. Fonction native de génération PDF hautement stylisée
  const handleDownloadPDF = (targetClass: ClassName) => {
    const doc = new jsPDF()

    // Design du Document (Couleurs de base)
    doc.setFillColor(152, 28, 41) // Rouge Sacré Cœur
    doc.rect(0, 0, 210, 40, 'F')

    // En-tête
    doc.setTextColor(255, 255, 255)
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(22)
    doc.text('GROUPE SCOLAIRE SACRE-CŒUR', 15, 18)

    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(12)
    doc.text(`Emploi du temps officiel : ${targetClass.nom_classe}`, 15, 28)

    // Contenu principal
    let yPosition = 55
    doc.setTextColor(40, 40, 40)

    DAYS.forEach(day => {
      const dayEntries = schedule
        .filter(e => e.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))

      // Empêcher le texte de déborder de la page A4 basique
      if (yPosition > 260) {
        doc.addPage()
        yPosition = 20
      }

      // Titre du Jour
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(152, 28, 41)
      doc.text(day.toUpperCase(), 15, yPosition)
      yPosition += 6

      // Ligne séparatrice
      doc.setDrawColor(220, 220, 220)
      doc.line(15, yPosition, 195, yPosition)
      yPosition += 8

      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(60, 60, 60)

      if (dayEntries.length === 0) {
        doc.setFont('Helvetica', 'oblique')
        doc.text('Aucun cours programmé', 20, yPosition)
        yPosition += 10
      } else {
        dayEntries.forEach(e => {
          doc.setFont('Helvetica', 'bold')
          const timeStr = `[${e.startTime} - ${e.endTime}]`
          doc.text(timeStr, 20, yPosition)

          doc.setFont('Helvetica', 'normal')
          const detailsStr = `${e.subject}  (Salle: ${e.room}${e.teacherName ? ` · Prof: ${e.teacherName}` : ''})`
          doc.text(detailsStr, 58, yPosition)

          yPosition += 8
        })
        yPosition += 4
      }
    })

    // Génération et téléchargement
    const fileName = `Horaire_${targetClass.nom_classe.replace(/\s+/g, '_')}.pdf`
    doc.save(fileName)
  }

  // Écran de chargement initial de la structure des classes
  if (isLoadingClasses) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2">
        <Loader2 className="size-8 animate-spin text-sacred-red" />
        <p className="text-sm opacity-60">
          Chargement de vos classes assignées...
        </p>
      </div>
    )
  }

  // VUE ÉTAPE 2 : Affichage de l'emploi du temps de la classe sélectionnée
  if (selectedClass) {
    return (
      <div>
        <button
          onClick={() => {
            setSelectedClass(null)
            setSearchQuery('')
          }}
          className="text-sm opacity-60 hover:opacity-100 flex items-center gap-2 mb-4 transition-opacity font-medium"
        >
          <ArrowLeft className="size-4" /> Retour au tableau des classes
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <PageHeader
            title={`Emploi du temps : ${selectedClass.nom_classe}`}
            subtitle="Consultation en temps réel de la répartition des enseignements."
          />
          <button
            onClick={() => handleDownloadPDF(selectedClass)}
            className="h-11 px-5 rounded-xl bg-sacred-red text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity self-start sm:self-auto shadow-sm"
          >
            <Download className="size-4" />
            Télécharger en PDF
          </button>
        </div>

        {/* Barre de recherche locale */}
        <div className="p-5 rounded-3xl bg-card border border-border mb-6">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 opacity-50" />
            <input
              type="text"
              placeholder="Filtrer les cours par matière, salle, enseignant..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm"
            />
          </div>
        </div>

        {isLoadingSchedule ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin opacity-50 text-sacred-red" />
          </div>
        ) : (
          <div className="space-y-6">
            {DAYS.map(day => {
              const entriesForDay = filteredSchedule.filter(
                s => s.dayOfWeek === day
              )
              if (searchQuery && entriesForDay.length === 0) return null

              return (
                <div key={day} className="space-y-2">
                  <h3 className="font-display text-lg border-b border-border pb-1 px-1 opacity-80 font-semibold">
                    {day}
                  </h3>

                  <div className="space-y-2">
                    {entriesForDay
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map(s => (
                        <div
                          key={s.id}
                          className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-center min-w-20 border-r border-border pr-4">
                              <p className="text-[11px] font-bold opacity-40 uppercase tracking-wider">
                                Horaire
                              </p>
                              <p className="text-xs font-semibold mt-0.5 whitespace-nowrap">
                                {s.startTime} - {s.endTime}
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-foreground">
                                {s.subject}
                              </p>
                              <p className="text-xs opacity-60 mt-0.5">
                                Salle :{' '}
                                <span className="font-medium text-foreground">
                                  {s.room}
                                </span>
                                {s.teacherName &&
                                  ` · Enseignant : ${s.teacherName}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )
            })}

            {filteredSchedule.length === 0 && (
              <p className="text-sm opacity-60 text-center py-12 border border-dashed border-border rounded-2xl">
                Aucune période de cours enregistrée pour les critères actuels.
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  // VUE ÉTAPE 1 : Grille des classes enseignées par le professeur
  return (
    <div>
      <PageHeader
        title="Vos classes assignées"
        subtitle="Sélectionnez l'une de vos classes pour consulter son emploi du temps complet ou l'exporter."
      />

      {myClasses.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-3xl bg-card mt-6">
          <p className="text-sm opacity-60 max-w-sm mx-auto">
            Vous n'êtes actuellement assigné à aucune classe. Veuillez contacter
            la direction pour valider vos accès académiques.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {myClasses.map(c => (
            <div
              key={c.id}
              onClick={() => setSelectedClass(c)}
              className="p-6 rounded-3xl bg-card border border-border text-left hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer"
            >
              <div className="size-10 rounded-xl bg-sacred-red/10 text-sacred-red grid place-items-center mb-4 group-hover:scale-110 transition-transform">
                <span className="font-bold text-xs uppercase">
                  {c.nom_classe.substring(0, 2)}
                </span>
              </div>
              <p className="font-display text-2xl font-bold mb-1 tracking-tight">
                {c.nom_classe}
              </p>
              <p className="text-xs opacity-60 mt-2">
                Cliquez pour voir les créneaux horaires & générer le PDF.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TeacherHoraires
