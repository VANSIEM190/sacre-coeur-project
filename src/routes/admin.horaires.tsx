import { PageHeader } from '@/components/dashboard-shell'
import { useSchoolStore } from '@/stores/school-store'
import { useState, useMemo } from 'react'
import { ALL_CLASS_NAMES } from '@/lib/mock-seed'
import type { SchoolClassName, ScheduleEntry } from '@/lib/types'
import {
  Plus,
  Trash2,
  ArrowLeft,
  Search,
  Download,
  Edit3,
  X,
  Check,
} from 'lucide-react'
import { useFetchData } from '@/hooks/useQuery'
import { classService } from '@/services/classServices'

const DAYS: ScheduleEntry['dayOfWeek'][] = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
]

function AdminHoraires() {
  const schedule = useSchoolStore(s => s.schedule)
  const create = useSchoolStore(s => s.createScheduleEntry)
  const remove = useSchoolStore(s => s.deleteScheduleEntry)
  // Utilisation d'une méthode de mise à jour si elle existe dans ton store ou réassignation via une action custom
  const update = useSchoolStore((s: any) => s.updateScheduleEntry)

  // Navigation et filtrage
  const [selectedClass, setSelectedClass] = useState<SchoolClassName | null>(
    null
  )
  const [searchQuery, setSearchQuery] = useState('')

  // États pour l'édition d'une entrée d'horaire
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{
    startTime: string
    endTime: string
    subject: string
    room: string
    teacher: string
  }>({
    startTime: '',
    endTime: '',
    subject: '',
    room: '',
    teacher: '',
  })

  // Chargement des classes
  const { data: allClasses } = useFetchData(
    ['classes'],
    classService.getAllClasses
  )

  // Formulaire d'ajout
  const [form, setForm] = useState({
    className: '4ème Secondaire' as SchoolClassName,
    dayOfWeek: 'Lundi' as ScheduleEntry['dayOfWeek'],
    startTime: '08:00',
    endTime: '09:30',
    subject: '',
    room: '',
    teacher: '',
  })

  // Préparation du formulaire d'édition
  const handleStartEdit = (entry: any) => {
    setEditingId(entry.id)
    setEditForm({
      startTime: entry.startTime,
      endTime: entry.endTime,
      subject: entry.subject,
      room: entry.room,
      teacher: entry.teacher || '',
    })
  }

  // Soumission de la modification
  const handleUpdateSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault()
    if (update) {
      update(id, editForm)
    } else {
      // Sécurité alternative si l'action brute n'est pas encore présente dans le store physique
      const oldEntry = schedule.find(s => s.id === id)
      if (oldEntry) {
        remove(id)
        create({
          ...oldEntry,
          ...editForm,
        })
      }
    }
    setEditingId(null)
  }

  // Fonctionnalité pour générer et télécharger l'horaire de la classe sélectionnée
  const handleDownloadSchedule = (className: SchoolClassName) => {
    const classEntries = schedule.filter(s => s.className === className)

    // Formatage texte propre de l'horaire
    let txtContent = `EMPLOI DU TEMPS - CLASSE : ${className}\n`
    txtContent += `=========================================\n\n`

    DAYS.forEach(day => {
      const dayEntries = classEntries
        .filter(e => e.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))

      txtContent += `--- ${day.toUpperCase()} ---\n`
      if (dayEntries.length === 0) {
        txtContent += `  Aucun cours programmé\n`
      } else {
        dayEntries.forEach((e: any) => {
          txtContent += `  [${e.startTime} - ${e.endTime}] ${e.subject} (Local: ${e.room}${e.teacher ? ` · Prof: ${e.teacher}` : ''})\n`
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
      `Horaire_${className.replace(/\s+/g, '_')}.txt`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Filtrage combiné (Classe sélectionnée + Barre de recherche textuelle incluant le professeur)
  const filteredSchedule = useMemo(() => {
    if (!selectedClass) return []
    return schedule.filter(s => {
      const matchesClass = s.className === selectedClass
      const matchesSearch =
        s.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.dayOfWeek.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s as any).teacher?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesClass && matchesSearch
    })
  }, [schedule, selectedClass, searchQuery])

  // Vue d'une classe sélectionnée (Emploi du temps complet du lundi au samedi)
  if (selectedClass) {
    return (
      <div>
        <button
          onClick={() => {
            setSelectedClass(null)
            setSearchQuery('')
          }}
          className="text-sm opacity-60 hover:opacity-100 flex items-center gap-2 mb-4 transition-opacity"
        >
          <ArrowLeft className="size-4" /> Retour aux classes
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <PageHeader
            title={`Horaire : ${selectedClass}`}
            subtitle="Vue globale du lundi au samedi et gestion des périodes."
          />
          <button
            onClick={() => handleDownloadSchedule(selectedClass)}
            className="h-11 px-5 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity self-start sm:self-auto"
          >
            <Download className="size-4" />
            Télécharger l'horaire
          </button>
        </div>

        {/* Zone de Filtrage (Design identique aux archives) */}
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

        {/* Liste triée par jours de la semaine */}
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
                    .map((s: any) => (
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
                                className="px-3 py-1.5 rounded-xl border border-border bg-background focus:outline-none text-xs"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] uppercase font-semibold opacity-50">
                                Professeur
                              </label>
                              <input
                                required
                                placeholder="Nom du prof"
                                value={editForm.teacher}
                                onChange={e =>
                                  setEditForm({
                                    ...editForm,
                                    teacher: e.target.value,
                                  })
                                }
                                className="px-3 py-1.5 rounded-xl border border-border bg-background focus:outline-none text-xs"
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
                                className="px-3 py-1.5 rounded-xl border border-border bg-background focus:outline-none text-xs"
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
                                className="px-3 py-1.5 rounded-xl border border-border bg-background focus:outline-none text-xs"
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
                                className="px-3 py-1.5 rounded-xl border border-border bg-background focus:outline-none text-xs"
                              />
                            </div>
                            <div className="sm:col-span-5 flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1.5 rounded-full border border-border text-xs font-medium flex items-center gap-1 hover:bg-muted transition-colors"
                              >
                                <X className="size-3" /> Annuler
                              </button>
                              <button
                                type="submit"
                                className="px-3 py-1.5 rounded-full bg-sacred-red text-white text-xs font-semibold flex items-center gap-1 hover:opacity-90 transition-opacity"
                              >
                                <Check className="size-3" /> Enregistrer
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
                                  {s.teacher && `· Prof : ${s.teacher}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleStartEdit(s)}
                                className="size-9 rounded-full border border-border grid place-items-center hover:bg-muted text-primary transition-colors"
                                title="Modifier la période"
                              >
                                <Edit3 className="size-4" />
                              </button>
                              <button
                                onClick={() =>
                                  confirm(
                                    `Supprimer la période de ${s.subject} ?`
                                  ) && remove(s.id)
                                }
                                className="size-9 rounded-full border border-border grid place-items-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                title="Supprimer la période"
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
              Aucun cours n'est configuré ou ne correspond à vos critères de
              recherche.
            </p>
          )}
        </div>
      </div>
    )
  }

  // Vue principale : Liste de toutes les cartes de classes
  return (
    <div>
      <PageHeader
        title="Horaires de cours"
        subtitle="Sélectionnez une classe pour gérer ou télécharger son emploi du temps."
      />

      {/* Formulaire d'ajout global d'une période */}
      <form
        onSubmit={e => {
          e.preventDefault()
          create(form)
          setForm({ ...form, subject: '', room: '', teacher: '' })
        }}
        className="p-6 rounded-3xl bg-card border border-border mb-8 grid sm:grid-cols-3 gap-3"
      >
        <div className="sm:col-span-3">
          <h2 className="font-display text-xl mb-1">
            Ajouter une période de cours
          </h2>
        </div>

        <select
          value={form.className}
          onChange={e =>
            setForm({ ...form, className: e.target.value as SchoolClassName })
          }
          className="px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm"
        >
          {allClasses?.map(c => (
            <option key={c.id}>{c.nom_classe}</option>
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
          className="px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm"
        >
          {DAYS.map(d => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <input
          required
          placeholder="Matière"
          value={form.subject}
          onChange={e => setForm({ ...form, subject: e.target.value })}
          className="px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm"
        />
        <input
          required
          placeholder="Nom du Professeur"
          value={form.teacher}
          onChange={e => setForm({ ...form, teacher: e.target.value })}
          className="px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm"
        />
        <input
          type="time"
          value={form.startTime}
          onChange={e => setForm({ ...form, startTime: e.target.value })}
          className="px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm"
        />
        <input
          type="time"
          value={form.endTime}
          onChange={e => setForm({ ...form, endTime: e.target.value })}
          className="px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm"
        />
        <input
          required
          placeholder="Local / Salle"
          value={form.room}
          onChange={e => setForm({ ...form, room: e.target.value })}
          className="px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm"
        />
        <button className="sm:col-span-3 px-5 py-2.5 rounded-full bg-sacred-red text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
          <Plus className="size-4" /> Ajouter à l'emploi du temps
        </button>
      </form>

      {/* Grid des classes */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_CLASS_NAMES.map(className => {
          const courseCount = schedule.filter(
            s => s.className === className
          ).length

          return (
            <div
              key={className}
              onClick={() => setSelectedClass(className)}
              className="p-6 rounded-3xl bg-card border border-border text-left hover:shadow-xl hover:-translate-y-1 transition-all flex items-start justify-between group cursor-pointer"
            >
              <div>
                <p className="font-display text-2xl mb-2">{className}</p>
                <p className="text-sm opacity-60">
                  {courseCount} période{courseCount > 1 ? 's' : ''} de cours
                  enregistrée{courseCount > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AdminHoraires
