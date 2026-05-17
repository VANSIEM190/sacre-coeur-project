import { PageHeader } from '@/components/dashboard-shell'
import { useSchoolStore } from '@/stores/school-store'
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { ArchiveDocument } from '@/lib/types'

function AdminArchives() {
  const items = useSchoolStore(s => s.archives)
  const create = useSchoolStore(s => s.createArchive)
  const remove = useSchoolStore(s => s.deleteArchive)
  const [form, setForm] = useState({
    title: '',
    year: new Date().getFullYear(),
    category: 'Palmarès' as ArchiveDocument['category'],
    description: '',
  })

  return (
    <div>
      <PageHeader
        title="Archives"
        subtitle="Coffre-fort numérique des documents de l'école."
      />
      <form
        onSubmit={e => {
          e.preventDefault()
          create(form)
          setForm({ ...form, title: '', description: '' })
        }}
        className="p-6 rounded-3xl bg-card border border-border mb-8 grid sm:grid-cols-2 gap-3"
      >
        <input
          required
          placeholder="Titre"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className="px-4 py-3 rounded-xl border border-border bg-background"
        />
        <input
          type="number"
          placeholder="Année"
          value={form.year}
          onChange={e => setForm({ ...form, year: Number(e.target.value) })}
          className="px-4 py-3 rounded-xl border border-border bg-background"
        />
        <select
          value={form.category}
          onChange={e =>
            setForm({
              ...form,
              category: e.target.value as ArchiveDocument['category'],
            })
          }
          className="px-4 py-3 rounded-xl border border-border bg-background"
        >
          {['Palmarès', 'Bulletin', 'Procès-Verbal', 'Autre'].map(c => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input
          placeholder="Description"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className="px-4 py-3 rounded-xl border border-border bg-background"
        />
        <button className="sm:col-span-2 px-5 py-2.5 rounded-full bg-sacred-red text-white font-semibold flex items-center justify-center gap-2">
          <Plus className="size-4" /> Archiver
        </button>
      </form>
      <div className="space-y-2">
        {items.map(a => (
          <div
            key={a.id}
            className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between gap-4"
          >
            <div>
              <p className="font-semibold">{a.title}</p>
              <p className="text-xs opacity-60">
                {a.category} · {a.year} · {a.description}
              </p>
            </div>
            <button
              onClick={() => remove(a.id)}
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

export default AdminArchives
