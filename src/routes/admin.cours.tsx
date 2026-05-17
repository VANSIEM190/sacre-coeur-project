import { PageHeader } from '@/components/dashboard-shell'
import { useSchoolStore } from '@/stores/school-store'
import { useState } from 'react'
import { ALL_CLASS_NAMES } from '@/lib/mock-seed'
import type { SchoolClassName } from '@/lib/types'
import { Plus, Trash2 } from 'lucide-react'

function AdminCours() {
  const courses = useSchoolStore(s => s.courses)
  const create = useSchoolStore(s => s.createCourse)
  const remove = useSchoolStore(s => s.deleteCourse)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [cls, setCls] = useState<SchoolClassName>('4ème Secondaire')

  return (
    <div>
      <PageHeader
        title="Cours"
        subtitle="Publiez les supports de cours par classe."
      />
      <form
        onSubmit={e => {
          e.preventDefault()
          create({ title, description: desc, className: cls })
          setTitle('')
          setDesc('')
        }}
        className="p-6 rounded-3xl bg-card border border-border mb-8 space-y-3"
      >
        <input
          required
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Titre du cours"
          className="w-full px-4 py-3 rounded-xl border border-border bg-background"
        />
        <textarea
          required
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Description"
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background resize-none"
        />
        <select
          value={cls}
          onChange={e => setCls(e.target.value as SchoolClassName)}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background"
        >
          {ALL_CLASS_NAMES.map(c => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button className="px-5 py-2.5 rounded-full bg-sacred-red text-white font-semibold flex items-center gap-2">
          <Plus className="size-4" /> Publier
        </button>
      </form>
      <div className="space-y-3">
        {courses.map(c => (
          <div
            key={c.id}
            className="p-4 rounded-2xl bg-card border border-border flex items-start justify-between gap-4"
          >
            <div>
              <p className="font-semibold">{c.title}</p>
              <p className="text-xs opacity-60">
                {c.className} · {c.description}
              </p>
            </div>
            <button
              onClick={() => remove(c.id)}
              className="size-9 rounded-full border border-border grid place-items-center hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminCours
