import { PageHeader } from '@/components/Dashboard-shell'
import { useState, useMemo } from 'react'
import type { ScheduleEntry, ClassName } from '@/lib/types'
import {
  Plus,
  Trash2,
  ArrowLeft,
  Search,
  Download,
  Edit3,
  X,
  Check,
  Loader2,
} from 'lucide-react'
import { useFetchData, useMutateData } from '@/hooks/useQuery'
import { classService } from '@/services/classe/classe.service'
import { horraireServices } from '@/services/schedule/schedule.service'
import { useQueryClient } from '@tanstack/react-query'

const DAYS: ScheduleEntry['dayOfWeek'][] = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
]

// Type local strict pour l'état du formulaire d'édition
interface EditFormState {
  startTime: string
  endTime: string
  subject: string
  room: string
  teacherName: string
}

function AdminHoraires() {
  const queryClient = useQueryClient()

  // Navigation basée sur le type structurel ClassName réel de ta base de données
  const [selectedClass, setSelectedClass] = useState<ClassName | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // États pour l'édition d'une entrée d'horaire dotés d'un typage précis
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>({
    startTime: '',
    endTime: '',
    subject: '',
    room: '',
    teacherName: '',
  })

  // Formulaire d'ajout typé avec omission de la clé système 'id' et 'created_at'
  const [form, setForm] = useState<Omit<ScheduleEntry, 'id' | 'created_at'>>({
    classe_id: '',
    dayOfWeek: 'Lundi',
    startTime: '08:00',
    endTime: '09:30',
    subject: '',
    room: '',
    teacherName: '',
  })

  // 1. Chargement de toutes les classes via l'API (Typé avec ClassName[])
  const { data: allClasses, isLoading: isLoadingClasses } = useFetchData<
    ClassName[]
  >(['classes'], classService.getAllClasses)

  // 2. Chargement des périodes de cours (Typé avec ScheduleEntry[])
  const { data: schedule = [], isLoading: isLoadingSchedule } = useFetchData<
    ScheduleEntry[]
  >(
    ['schedule', selectedClass?.id],
    () => horraireServices.getSchedule(selectedClass?.id || ''),
    { enabled: !!selectedClass?.id }
  )

  // 3. Mutations TanStack Query sécurisées et typées
  const createMutation = useMutateData<
    ScheduleEntry,
    Error,
    Omit<ScheduleEntry, 'id' | 'created_at'>
  >(horraireServices.createScheduleEntry, {
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['schedule', selectedClass?.id],
      })
      setForm(prev => ({ ...prev, subject: '', room: '', teacherName: '' }))
    },
    onError: err => alert(`Erreur de création : ${err.message}`),
  })

  const updateMutation = useMutateData<
    ScheduleEntry,
    Error,
    {
      id: string
      payload: Partial<Omit<ScheduleEntry, 'id' | 'classe_id' | 'created_at'>>
    }
  >(({ id, payload }) => horraireServices.updateScheduleEntry(id, payload), {
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['schedule', selectedClass?.id],
      })
      setEditingId(null)
    },
    onError: err => alert(`Erreur de modification : ${err.message}`),
  })

  const deleteMutation = useMutateData<boolean, Error, string>(
    horraireServices.deleteScheduleEntry,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['schedule', selectedClass?.id],
        })
      },
      onError: err => alert(`Erreur de suppression : ${err.message}`),
    }
  )

  // Initialisation sécurisée de l'édition
  const handleStartEdit = (entry: ScheduleEntry) => {
    setEditingId(entry.id)
    setEditForm({
      startTime: entry.startTime,
      endTime: entry.endTime,
      subject: entry.subject,
      room: entry.room,
      teacherName: entry.teacherName || '',
    })
  }

  const handleUpdateSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault()
    updateMutation.mutate({ id, payload: editForm })
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const targetClassId = form.classe_id || (allClasses && allClasses[0]?.id)
    if (!targetClassId) {
      alert('Veuillez sélectionner ou créer une classe au préalable.')
      return
    }
    createMutation.mutate({
      ...form,
      classe_id: targetClassId,
    })
  }

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

  // Filtrage à chaud sur l'état en cache
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
            subtitle="Vue globale synchronisée avec la base de données centrale."
          />
          <button
            onClick={() => handleDownloadSchedule(selectedClass)}
            className="h-11 px-5 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity self-start sm:self-auto"
          >
            <Download className="size-4" />
            Télécharger l'horaire
          </button>
        </div>

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
                          className="p-4 rounded-2xl bg-card border border-border flex flex-col gap-3"
                        >
                          {editingId === s.id ? (
                            <form
                              onSubmit={e => handleUpdateSubmit(e, s.id)}
                              className="grid sm:grid-cols-5 gap-3 w-full items-end"
                            >
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-semibold opacity-50">
                                  Matière
                                </label>
                                <input
                                  required
                                  value={editForm.subject}
                                  onChange={e =>
                                    setEditForm({
                                      ...editForm,
                                      subject: e.target.value,
                                    })
                                  }
                                  className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-semibold opacity-50">
                                  Professeur
                                </label>
                                <input
                                  required
                                  value={editForm.teacherName}
                                  onChange={e =>
                                    setEditForm({
                                      ...editForm,
                                      teacherName: e.target.value,
                                    })
                                  }
                                  className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-semibold opacity-50">
                                  Début
                                </label>
                                <input
                                  type="time"
                                  required
                                  value={editForm.startTime}
                                  onChange={e =>
                                    setEditForm({
                                      ...editForm,
                                      startTime: e.target.value,
                                    })
                                  }
                                  className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-semibold opacity-50">
                                  Fin
                                </label>
                                <input
                                  type="time"
                                  required
                                  value={editForm.endTime}
                                  onChange={e =>
                                    setEditForm({
                                      ...editForm,
                                      endTime: e.target.value,
                                    })
                                  }
                                  className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-semibold opacity-50">
                                  Local
                                </label>
                                <input
                                  required
                                  value={editForm.room}
                                  onChange={e =>
                                    setEditForm({
                                      ...editForm,
                                      room: e.target.value,
                                    })
                                  }
                                  className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs"
                                />
                              </div>
                              <div className="sm:col-span-5 flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="px-3 py-1.5 rounded-full border border-border text-xs font-medium flex items-center gap-1 hover:bg-muted"
                                >
                                  <X className="size-3" /> Annuler
                                </button>
                                <button
                                  type="submit"
                                  disabled={updateMutation.isPending}
                                  className="px-3 py-1.5 rounded-full bg-sacred-red text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                                >
                                  {updateMutation.isPending ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : (
                                    <Check className="size-3" />
                                  )}
                                  Enregistrer
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="flex items-center justify-between gap-4 w-full">
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
                                    {s.teacherName &&
                                      `· Prof : ${s.teacherName}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => handleStartEdit(s)}
                                  className="size-9 rounded-full border border-border grid place-items-center hover:bg-muted text-primary"
                                >
                                  <Edit3 className="size-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    confirm(
                                      `Supprimer la période de ${s.subject} ?`
                                    ) && deleteMutation.mutate(s.id)
                                  }
                                  disabled={deleteMutation.isPending}
                                  className="size-9 rounded-full border border-border grid place-items-center hover:bg-destructive hover:text-destructive-foreground"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )
            })}

            {filteredSchedule.length === 0 && (
              <p className="text-sm opacity-60 text-center py-12 border border-dashed border-border rounded-2xl">
                Aucun cours configuré pour cette classe.
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Horaires de cours"
        subtitle="Sélectionnez une classe pour gérer ou télécharger son emploi du temps."
      />

      <form
        onSubmit={handleCreateSubmit}
        className="p-6 rounded-3xl bg-card border border-border mb-8 grid sm:grid-cols-3 gap-3"
      >
        <div className="sm:col-span-3">
          <h2 className="font-display text-xl mb-1">
            Ajouter une période de cours
          </h2>
        </div>

        <select
          value={form.classe_id}
          onChange={e => setForm({ ...form, classe_id: e.target.value })}
          className="px-4 py-3 rounded-xl border border-border bg-background text-sm"
        >
          <option value="" disabled>
            Choisir la classe cible
          </option>
          {allClasses?.map(c => (
            <option key={c.id} value={c.id}>
              {c.nom_classe}
            </option>
          ))}
        </select>

        <select
          value={form.dayOfWeek}
          onChange={e =>
            setForm({
              ...form,
              dayOfWeek: e.target.value as ScheduleEntry['dayOfWeek'],
            })
          }
          className="px-4 py-3 rounded-xl border border-border bg-background text-sm"
        >
          {DAYS.map(d => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <input
          required
          placeholder="Matière"
          value={form.subject}
          onChange={e => setForm({ ...form, subject: e.target.value })}
          className="px-4 py-3 rounded-xl border border-border bg-background text-sm"
        />
        <input
          required
          placeholder="Nom du Professeur"
          value={form.teacherName}
          onChange={e => setForm({ ...form, teacherName: e.target.value })}
          className="px-4 py-3 rounded-xl border border-border bg-background text-sm"
        />
        <input
          type="time"
          value={form.startTime}
          onChange={e => setForm({ ...form, startTime: e.target.value })}
          className="px-4 py-3 rounded-xl border border-border bg-background text-sm"
        />
        <input
          type="time"
          value={form.endTime}
          onChange={e => setForm({ ...form, endTime: e.target.value })}
          className="px-4 py-3 rounded-xl border border-border bg-background text-sm"
        />
        <input
          required
          placeholder="Local / Salle"
          value={form.room}
          onChange={e => setForm({ ...form, room: e.target.value })}
          className="px-4 py-3 rounded-xl border border-border bg-background text-sm"
        />

        <button
          disabled={createMutation.isPending}
          className="sm:col-span-3 h-12 rounded-full bg-sacred-red text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
        >
          {createMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Ajouter à l'emploi du temps
        </button>
      </form>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allClasses?.map(c => (
          <div
            key={c.id}
            onClick={() => setSelectedClass(c)}
            className="p-6 rounded-3xl bg-card border border-border text-left hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer"
          >
            <p className="font-display text-2xl mb-2">{c.nom_classe}</p>
            <p className="text-sm opacity-60">
              Cliquez pour gérer ou télécharger l'emploi du temps.
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminHoraires
