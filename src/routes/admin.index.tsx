import { Users, GraduationCap, UserCheck, Megaphone } from 'lucide-react'
import { PageHeader } from '@/components/dashboard-shell'
import { useAuthStore } from '@/stores/auth-store'
import { useSchoolStore } from '@/stores/school-store'

function AdminHome() {
  const users = useAuthStore(s => s.registeredUsers)
  const announcements = useSchoolStore(s => s.announcements)
  const students = users.filter(u => u.role === 'student')
  const teachers = users.filter(u => u.role === 'teacher')
  const pending = students.filter(
    s => s.role === 'student' && !s.isValidatedByAdmin
  )

  const stats = [
    {
      icon: Users,
      label: 'Élèves',
      value: students.length,
      color: 'bg-sacred-red/10 text-sacred-red',
    },
    {
      icon: GraduationCap,
      label: 'Enseignants',
      value: teachers.length,
      color: 'bg-sacred-gold/20 text-sacred-gold',
    },
    {
      icon: UserCheck,
      label: 'En attente de validation',
      value: pending.length,
      color: 'bg-amber-500/10 text-amber-600',
    },
    {
      icon: Megaphone,
      label: 'Annonces actives',
      value: announcements.length,
      color: 'bg-emerald-500/10 text-emerald-600',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Bienvenue, Père Recteur"
        subtitle="Vue d'ensemble de l'école Sacré Cœur de Jésus."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(s => (
          <div
            key={s.label}
            className="p-6 rounded-3xl bg-card border border-border"
          >
            <div
              className={`size-12 rounded-2xl ${s.color} grid place-items-center mb-4`}
            >
              <s.icon className="size-6" />
            </div>
            <p className="font-display text-4xl mb-1">{s.value}</p>
            <p className="text-sm opacity-60">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-card border border-border">
          <h2 className="font-display text-2xl mb-4">Dernières annonces</h2>
          <div className="space-y-3">
            {announcements.slice(0, 3).map(a => (
              <div
                key={a.id}
                className="pb-3 border-b border-border last:border-0"
              >
                <p className="font-semibold text-sm">{a.title}</p>
                <p className="text-xs opacity-60 truncate">{a.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-sacred-red text-white">
          <h2 className="font-display text-2xl mb-4">
            Inscriptions en attente
          </h2>
          <p className="font-display text-6xl mb-2">{pending.length}</p>
          <p className="opacity-80 text-sm mb-6">
            élèves à valider dans l'onglet « Validations ».
          </p>
        </div>
      </div>
    </div>
  )
}

export default AdminHome
