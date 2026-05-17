import { useState } from 'react'
import { PageHeader } from '@/components/dashboard-shell'
import { useAuthStore } from '@/stores/auth-store'
import { ALL_CLASS_NAMES } from '@/lib/mock-seed'
import type { SchoolClassName, TeacherUser } from '@/lib/types'
import { Plus, Trash2, Copy } from 'lucide-react'

function AdminTeachers() {
  const users = useAuthStore(s => s.registeredUsers)
  const upsert = useAuthStore(s => s.upsertUser)
  const remove = useAuthStore(s => s.removeUser)
  const teachers = users.filter((u): u is TeacherUser => u.role === 'teacher')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [classes, setClasses] = useState<SchoolClassName[]>([])

  const toggleClass = (c: SchoolClassName) =>
    setClasses(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    )

  const generateAccessId = () =>
    `SC-T-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const newTeacher: TeacherUser = {
      id: `teacher-${Date.now()}`,
      email,
      role: 'teacher',
      fullName: name,
      teacherAccessId: generateAccessId(),
      assignedClassNames: classes,
      createdAt: new Date().toISOString(),
    }
    upsert(newTeacher)
    setName('')
    setEmail('')
    setClasses([])
  }

  return (
    <div>
      <PageHeader
        title="Enseignants"
        subtitle="Créez des comptes enseignants et attribuez les classes."
      />

      <form
        onSubmit={submit}
        className="p-6 rounded-3xl bg-card border border-border mb-8 space-y-4"
      >
        <h2 className="font-display text-xl">Nouvel enseignant</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="Nom complet"
            className="px-4 py-3 rounded-xl border border-border bg-background"
          />
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            required
            placeholder="Email"
            className="px-4 py-3 rounded-xl border border-border bg-background"
          />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest opacity-70 mb-2">
            Classes attribuées
          </p>
          <div className="flex flex-wrap gap-2">
            {ALL_CLASS_NAMES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => toggleClass(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  classes.includes(c)
                    ? 'bg-sacred-red text-white border-sacred-red'
                    : 'border-border opacity-70'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-full bg-sacred-red text-white font-semibold flex items-center gap-2"
        >
          <Plus className="size-4" /> Créer l'enseignant
        </button>
      </form>

      <div className="space-y-3">
        {teachers.map(t => (
          <div
            key={t.id}
            className="p-5 rounded-2xl bg-card border border-border"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="font-semibold">{t.fullName}</p>
                <p className="text-xs opacity-60">{t.email}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    navigator.clipboard?.writeText(t.teacherAccessId)
                  }
                  className="px-3 py-2 rounded-full border border-border text-xs font-mono flex items-center gap-1.5 hover:bg-muted"
                >
                  <Copy className="size-3" /> {t.teacherAccessId}
                </button>
                <button
                  onClick={() => remove(t.id)}
                  className="size-9 rounded-full border border-border grid place-items-center hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
            <p className="text-xs opacity-60">
              Classes : {t.assignedClassNames.join(', ') || 'Aucune'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminTeachers
