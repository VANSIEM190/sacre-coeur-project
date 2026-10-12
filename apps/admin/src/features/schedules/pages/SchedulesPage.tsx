import { useMemo } from 'react'
import { ArrowLeft, Download, Loader2, Search } from 'lucide-react'
import { PageHeader } from '@sacre-coeur/ui/layouts/dashboard-shell'
import { useSchedulesPage } from '../hooks/useSchedulesPage'
import { SCHEDULE_DAYS } from '../types/schedule-forms'
import { ScheduleCreateForm } from '../components/ScheduleCreateForm'
import { ScheduleClassList } from '../components/ScheduleClassList'
import { ScheduleEntryCard } from '../components/ScheduleEntryCard'

export default function SchedulesPage() {
  const page = useSchedulesPage()
  const dayEntries = useMemo(() => SCHEDULE_DAYS.map(day => ({ day, entries: page.filteredSchedule.filter(entry => entry.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime)) })).filter(({ entries }) => !page.searchQuery || entries.length > 0), [page.filteredSchedule, page.searchQuery])

  if (page.isLoadingClasses) return <div className="flex flex-col items-center justify-center gap-2 py-24"><Loader2 className="size-8 animate-spin text-sacred-red" /><p className="text-sm opacity-60">Chargement de la structure scolaire...</p></div>

  if (page.selectedClass) return <div>
    <button onClick={() => { page.setSelectedClass(null); page.setSearchQuery('') }} className="mb-4 flex items-center gap-2 text-sm font-medium opacity-60 transition-opacity hover:opacity-100"><ArrowLeft className="size-4" /> Retour aux classes</button>
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><PageHeader title={`Horaire : ${page.selectedClass.nom_classe}`} subtitle="Vue globale synchronisée avec la base de données centrale." /><button onClick={() => page.downloadSchedule(page.selectedClass!)} className="flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-primary px-5 font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:self-auto"><Download className="size-4" />Télécharger l'horaire</button></div>
    <div className="mb-6 rounded-3xl border border-border bg-card p-5"><div className="relative w-full"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 opacity-50" /><input type="text" placeholder="Rechercher un cours par matière, professeur, local, jour..." value={page.searchQuery} onChange={event => page.setSearchQuery(event.target.value)} className="w-full rounded-xl border border-border bg-background py-2.5 pl-11 pr-4 text-sm focus:border-primary focus:outline-none" /></div></div>
    {page.scheduleError ? <p className="py-12 text-sm text-destructive">Impossible de charger cet emploi du temps.</p> : page.isLoadingSchedule ? <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin opacity-50" /></div> : <div className="space-y-6">{dayEntries.map(({ day, entries }) => <section key={day} className="space-y-2"><h3 className="border-b border-border px-1 pb-1 font-display text-lg opacity-80">{day}</h3><div className="space-y-2">{entries.map(entry => <ScheduleEntryCard key={entry.id} entry={entry} isEditing={page.editingId === entry.id} editForm={page.editForm} teachers={page.teachersForSelectedClass} isSaving={page.updateMutation.isPending} isDeleting={page.deleteMutation.isPending} onFormChange={page.setEditForm} onTeacherChange={page.selectEditTeacher} onEditStart={() => page.startEdit(entry)} onEditCancel={() => page.setEditingId(null)} onSubmit={event => page.submitUpdate(event, entry.id)} onDelete={() => confirm(`Supprimer la période de ${entry.subject} ?`) && page.deleteMutation.mutate(entry.id)} />)}</div></section>)}{page.filteredSchedule.length === 0 && <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm opacity-60">Aucun cours configuré pour cette classe.</p>}</div>}
  </div>

  return <div>
    <PageHeader title="Horaires de cours" subtitle="Sélectionnez une classe pour gérer ou télécharger son emploi du temps." />
    <ScheduleCreateForm classes={page.classes} teachers={page.teachersForForm} form={page.form} isSaving={page.createMutation.isPending} onFormChange={page.setForm} onTeacherChange={page.selectTeacher} onSubmit={page.submitCreate} />
    <ScheduleClassList classes={page.classes} onSelect={page.setSelectedClass} />
  </div>
}
