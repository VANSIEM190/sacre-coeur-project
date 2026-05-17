import { PageHeader } from '@/components/dashboard-shell'
import { useAuthStore } from '@/stores/auth-store'
import { useSchoolStore } from '@/stores/school-store'
import { Users, CalendarDays, ClipboardList } from 'lucide-react'
import type { TeacherUser } from '@/lib/types'

function TeacherHome() {
  const teacher = useAuthStore(s => s.currentUser) as TeacherUser
  const schedule = useSchoolStore(s => s.schedule)
  const sheets = useSchoolStore(s => s.gradingSheets)
  const mySchedule = schedule.filter(s =>
    teacher?.assignedClassNames.includes(s.className)
  )
  const mySheets = sheets.filter(s => s.teacherId === teacher?.id)

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${teacher?.fullName ?? ''}`}
        subtitle="Votre espace enseignant."
      />
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Stat
          icon={Users}
          label="Classes attribuées"
          value={teacher?.assignedClassNames.length ?? 0}
        />
        <Stat
          icon={CalendarDays}
          label="Heures par semaine"
          value={mySchedule.length}
        />
        <Stat
          icon={ClipboardList}
          label="Fiches soumises"
          value={mySheets.length}
        />
      </div>
      <div className="p-6 rounded-3xl bg-card border border-border">
        <h2 className="font-display text-2xl mb-4">Vos classes</h2>
        <div className="flex flex-wrap gap-2">
          {teacher?.assignedClassNames.map(c => (
            <span
              key={c}
              className="px-4 py-2 rounded-full bg-sacred-red text-white text-sm font-semibold"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users
  label: string
  value: number
}) {
  return (
    <div className="p-6 rounded-3xl bg-card border border-border">
      <div className="size-12 rounded-2xl bg-sacred-red/10 text-sacred-red grid place-items-center mb-3">
        <Icon className="size-5" />
      </div>
      <p className="font-display text-3xl">{value}</p>
      <p className="text-sm opacity-60">{label}</p>
    </div>
  )
}

export default TeacherHome
