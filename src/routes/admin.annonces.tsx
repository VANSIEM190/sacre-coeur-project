import { useState } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/Dashboard-shell'
import { useSchoolStore } from '@/stores/school-store'
import { useAuthStore } from '@/stores/auth-store'
import { ALL_CLASS_NAMES } from '@/lib/mock-seed'
import type { SchoolClassName } from '@/lib/types'

function AdminAnnonces() {
  const announcements = useSchoolStore(s => s.announcements)
  const create = useSchoolStore(s => s.createAnnouncement)
  const update = useSchoolStore(s => s.updateAnnouncement)
  const remove = useSchoolStore(s => s.deleteAnnouncement)
  const admin = useAuthStore(s => s.currentUser)

  const [editing, setEditing] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [target, setTarget] = useState<'all' | SchoolClassName>('all')

  const reset = () => {
    setEditing(null)
    setTitle('')
    setBody('')
    setTarget('all')
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!admin) return
    const payload = {
      title,
      body,
      authorId: admin.id,
      targetClassNames: target === 'all' ? ('all' as const) : [target],
    }
    if (editing) update(editing, payload)
    else create(payload)
    reset()
  }

  return (
    <div>
      <PageHeader
        title="Annonces"
        subtitle="Communiquez en temps réel avec les élèves."
      />

      <form
        onSubmit={submit}
        className="p-6 rounded-3xl bg-card border border-border mb-8 space-y-4"
      >
        <h2 className="font-display text-xl">
          {editing ? "Modifier l'annonce" : 'Nouvelle annonce'}
        </h2>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          placeholder="Titre"
          className="w-full px-4 py-3 rounded-xl border border-border bg-background"
        />
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          required
          placeholder="Message…"
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background resize-none"
        />
        <select
          value={target}
          onChange={e => setTarget(e.target.value as 'all' | SchoolClassName)}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background"
        >
          <option value="all">Toutes les classes</option>
          {ALL_CLASS_NAMES.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="flex gap-3">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-full bg-sacred-red text-white font-semibold flex items-center gap-2"
          >
            <Plus className="size-4" /> {editing ? 'Mettre à jour' : 'Publier'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={reset}
              className="px-5 py-2.5 rounded-full border border-border font-semibold"
            >
              Annuler
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {announcements.map(a => (
          <div
            key={a.id}
            className="p-5 rounded-2xl bg-card border border-border flex items-start justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="font-semibold">{a.title}</p>
              <p className="text-sm opacity-70 mt-1">{a.body}</p>
              <p className="text-xs opacity-50 mt-2">
                {a.targetClassNames === 'all'
                  ? 'Toutes classes'
                  : a.targetClassNames.join(', ')}{' '}
                · {new Date(a.createdAt).toLocaleString('fr-FR')}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => {
                  setEditing(a.id)
                  setTitle(a.title)
                  setBody(a.body)
                  setTarget(
                    a.targetClassNames === 'all' ? 'all' : a.targetClassNames[0]
                  )
                }}
                className="size-9 rounded-full border border-border grid place-items-center hover:bg-muted"
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={() => remove(a.id)}
                className="size-9 rounded-full border border-border grid place-items-center hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminAnnonces
