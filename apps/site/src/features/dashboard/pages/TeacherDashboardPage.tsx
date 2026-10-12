import { PageHeader } from '@sacre-coeur/ui/layouts/dashboard-shell'
import { useFetchData } from '@sacre-coeur/data-access/hooks/useQuery'
import { gradeService } from '@sacre-coeur/data-access/services/grade/grade.service'
import { horraireServices } from '@sacre-coeur/data-access/services/schedule/schedule.service'
import { Users, CalendarDays, ClipboardList, Loader2 } from 'lucide-react'
import { useTeacherAssignments } from '../../classes/hooks/useTeacherAssignments'

export default function TeacherDashboardPage() {
  const { currentUser, teacher, schoolYear, assignedClasses, isLoading, error } = useTeacherAssignments()
  const scheduleQuery = useFetchData(
    ['schedule', 'teacher', teacher?.id],
    () => horraireServices.getTeacherSchedule(teacher!.id),
    { enabled: !!teacher?.id }
  )
  const gradesQuery = useFetchData(
    ['grades', 'teacher', currentUser?.id, schoolYear],
    () => gradeService.getTeacherGrades(currentUser!.id, schoolYear),
    { enabled: !!currentUser?.id }
  )
  const assignedIds = new Set(assignedClasses.map(schoolClass => schoolClass.id))
  const hours = (scheduleQuery.data ?? [])
    .filter(entry => assignedIds.has(entry.classe_id))
    .reduce((total, entry) => {
      const minutes = (time: string) => {
        const [hour, minute] = time.split(':').map(Number)
        return hour * 60 + minute
      }
      return total + Math.max(0, minutes(entry.endTime) - minutes(entry.startTime))
    }, 0) / 60
  const sheetsCount = new Set(
    (gradesQuery.data ?? []).map(grade => JSON.stringify([grade.classe_id, grade.subject, grade.tranche]))
  ).size

  return (
    <div>
      <PageHeader title={`Bonjour, ${currentUser?.fullName ?? ''}`} subtitle="Votre espace enseignant." />
      {isLoading || scheduleQuery.isLoading || gradesQuery.isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-sacred-red" /></div>
      ) : error || scheduleQuery.error || gradesQuery.error ? (
        <p className="text-sm text-destructive mb-6">Impossible de charger votre tableau de bord.</p>
      ) : (
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Stat icon={Users} label="Classes attribuées" value={assignedClasses.length} />
          <Stat icon={CalendarDays} label="Heures par semaine" value={Math.round(hours * 100) / 100} />
          <Stat icon={ClipboardList} label="Fiches enregistrées" value={sheetsCount} />
        </div>
      )}
      <div className="p-6 rounded-3xl bg-card border border-border">
        <h2 className="font-display text-2xl mb-4">Vos classes</h2>
        <div className="flex flex-wrap gap-2">
          {assignedClasses.map(schoolClass => (
            <span key={schoolClass.id} className="px-4 py-2 rounded-full bg-sacred-red text-white text-sm font-semibold">{schoolClass.nom_classe}</span>
          ))}
          {!isLoading && !error && assignedClasses.length === 0 && <p className="text-sm opacity-60">Aucune classe attribuée pour cette année scolaire.</p>}
        </div>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="p-6 rounded-3xl bg-card border border-border">
      <div className="size-12 rounded-2xl bg-sacred-red/10 text-sacred-red grid place-items-center mb-3"><Icon className="size-5" /></div>
      <p className="font-display text-3xl">{value}</p>
      <p className="text-sm opacity-60">{label}</p>
    </div>
  )
}
