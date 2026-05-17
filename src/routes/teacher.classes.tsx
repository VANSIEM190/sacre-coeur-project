import { PageHeader } from '@/components/dashboard-shell'
import { useAuthStore } from '@/stores/auth-store'
import type { TeacherUser, StudentUser } from '@/lib/types'

function TeacherClasses() {
  const teacher = useAuthStore(s => s.currentUser) as TeacherUser
  const users = useAuthStore(s => s.registeredUsers)
  return (
    <div>
      <PageHeader
        title="Mes classes"
        subtitle="Classes qui vous ont été attribuées."
      />
      <div className="space-y-6">
        {teacher?.assignedClassNames.map(c => {
          const students = users.filter(
            (u): u is StudentUser =>
              u.role === 'student' &&
              u.currentClassName === c &&
              u.isValidatedByAdmin
          )
          return (
            <div
              key={c}
              className="p-6 rounded-3xl bg-card border border-border"
            >
              <p className="font-display text-2xl mb-4">
                {c}{' '}
                <span className="text-sm opacity-50">({students.length})</span>
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {students.map(s => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-background border border-border text-sm"
                  >
                    {s.fullName}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TeacherClasses
