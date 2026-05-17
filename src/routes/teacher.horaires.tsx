import { PageHeader } from '@/components/dashboard-shell'
import { useAuthStore } from '@/stores/auth-store'
import { useSchoolStore } from '@/stores/school-store'
import type { TeacherUser } from '@/lib/types'

function TeacherHoraires() {
  const teacher = useAuthStore(s => s.currentUser) as TeacherUser
  const schedule = useSchoolStore(s => s.schedule)
  const my = schedule.filter(s =>
    teacher?.assignedClassNames.includes(s.className)
  )
  return (
    <div>
      <PageHeader title="Horaires de vos classes" />
      <div className="space-y-2">
        {my.map(s => (
          <div
            key={s.id}
            className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="font-display text-sm">{s.dayOfWeek}</p>
                <p className="text-xs opacity-60">
                  {s.startTime}-{s.endTime}
                </p>
              </div>
              <div>
                <p className="font-semibold">{s.subject}</p>
                <p className="text-xs opacity-60">
                  {s.className} · {s.room}
                </p>
              </div>
            </div>
          </div>
        ))}
        {my.length === 0 && (
          <p className="text-sm opacity-60 text-center py-12">
            Aucun horaire défini.
          </p>
        )}
      </div>
    </div>
  )
}

export default TeacherHoraires
