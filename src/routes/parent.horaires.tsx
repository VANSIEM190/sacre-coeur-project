import { PageHeader } from '@/components/Dashboard-shell'
import { useState, useMemo } from 'react'
import type { ScheduleEntry, ClassName } from '@/lib/types'
import { ArrowLeft, Search, Download, Loader2 } from 'lucide-react'
import { useFetchData } from '@/hooks/useQuery'
import { classService } from '@/services/classe/classe.service'
import { horraireServices } from '@/services/schedule/schedule.service'

const DAYS: ScheduleEntry['dayOfWeek'][] = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
]

function StudentHoraires() {
  // Navigation basée sur le type structurel ClassName réel de la base de données
  const [selectedClass, setSelectedClass] = useState<ClassName | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // 1. Chargement de toutes les classes via l'API (Lecture seule)
  const { data: allClasses, isLoading: isLoadingClasses } = useFetchData<
    ClassName[]
  >(['classes'], classService.getAllClasses)

  // 2. Chargement des périodes de cours pour la classe sélectionnée (Lecture seule)
  const { data: schedule = [], isLoading: isLoadingSchedule } = useFetchData<
    ScheduleEntry[]
  >(
    ['schedule', selectedClass?.id],
    () => horraireServices.getSchedule(selectedClass?.id || ''),
    { enabled: !!selectedClass?.id }
  )

  // Téléchargement propre du fichier de l'horaire
  const handleDownloadSchedule = (targetClass: ClassName) => {
    let txtContent = `EMPLOI DU TEMPS - CLASSE : ${targetClass.nom_classe}\n`
    txtContent += `=========================================\n\n`

    DAYS.forEach(day => {
      const dayEntries = schedule
        .filter(e => e.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))

      txtContent += `--- ${day.toUpperCase()} ---\n`
      if (dayEntries.length === 0) {
        txtContent += `  Aucun cours programmé\n`
      } else {
        dayEntries.forEach(e => {
          txtContent += `  [${e.startTime} - ${e.endTime}] ${e.subject} (Local: ${e.room}${e.teacherName ? ` · Prof: ${e.teacherName}` : ''})\n`
        })
      }
      txtContent += `\n`
    })

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute(
      'download',
      `Horaire_${targetClass.nom_classe.replace(/\s+/g, '_')}.txt`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Filtrage local en mémoire pour la barre de recherche
  const filteredSchedule = useMemo<ScheduleEntry[]>(() => {
    return schedule.filter(s => {
      return (
        s.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.dayOfWeek.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.teacherName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })
  }, [schedule, searchQuery])

  if (isLoadingClasses) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2">
        <Loader2 className="size-8 animate-spin text-sacred-red" />
        <p className="text-sm opacity-60">
          Chargement de la structure scolaire...
        </p>
      </div>
    )
  }

  // VUE ÉCRAN 2 : Détails de l'emploi du temps de la classe sélectionnée
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
          <ArrowLeft className="size-4" /> Retour aux classes
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <PageHeader
            title={`Horaire : ${selectedClass.nom_classe}`}
            subtitle="Consultez et téléchargez votre emploi du temps mis à jour en temps réel."
          />
          <button
            onClick={() => handleDownloadSchedule(selectedClass)}
            className="h-11 px-5 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity self-start sm:self-auto"
          >
            <Download className="size-4" />
            Télécharger l'horaire
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="p-5 rounded-3xl bg-card border border-border mb-6">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 opacity-50" />
            <input
              type="text"
              placeholder="Rechercher un cours par matière, professeur, local, jour..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm"
            />
          </div>
        </div>

        {isLoadingSchedule ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin opacity-50" />
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
                  <h3 className="font-display text-lg border-b border-border pb-1 px-1 opacity-80">
                    {day}
                  </h3>

                  <div className="space-y-2">
                    {entriesForDay
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map(s => (
                        <div
                          key={s.id}
                          className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between gap-4 w-full"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-center min-w-17.5 border-r border-border pr-4">
                              <p className="font-semibold text-xs opacity-70">
                                {s.dayOfWeek}
                              </p>
                              <p className="text-[11px] font-medium opacity-50 mt-0.5">
                                {s.startTime} - {s.endTime}
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold text-sm">
                                {s.subject}
                              </p>
                              <p className="text-xs opacity-60">
                                Local : {s.room}{' '}
                                {s.teacherName && `· Prof : ${s.teacherName}`}
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
                Aucun cours planifié trouvé.
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  // VUE ÉCRAN 1 : Grille de sélection des classes
  return (
    <div>
      <PageHeader
        title="Horaires de cours"
        subtitle="Sélectionnez une classe pour consulter son emploi du temps."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {allClasses?.map(c => (
          <div
            key={c.id}
            onClick={() => setSelectedClass(c)}
            className="p-6 rounded-3xl bg-card border border-border text-left hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer"
          >
            <p className="font-display text-2xl mb-2">{c.nom_classe}</p>
            <p className="text-sm opacity-60">
              Cliquez pour voir ou télécharger l'emploi du temps de cette
              classe.
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StudentHoraires
