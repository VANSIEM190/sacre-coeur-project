import { PageHeader } from '@/components/dashboard-shell'
import { useAuthStore } from '@/stores/auth-store'
import { useSchoolStore } from '@/stores/school-store'
import type { StudentUser } from '@/lib/types'

function StudentAnnonces() {
  const student = useAuthStore(s => s.currentUser) as StudentUser
  const items = useSchoolStore(s => s.announcements).filter(
    a =>
      a.targetClassNames === 'all' ||
      a.targetClassNames.includes(student?.currentClassName)
  )
  return (
    <div>
      <PageHeader title="Annonces" />
      <div className="space-y-3">
        {items.map(a => (
          <div
            key={a.id}
            className="p-5 rounded-2xl bg-card border border-border"
          >
            <p className="font-semibold mb-1">{a.title}</p>
            <p className="text-sm opacity-70">{a.body}</p>
            <p className="text-xs opacity-50 mt-2">
              {new Date(a.createdAt).toLocaleString('fr-FR')}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StudentAnnonces
