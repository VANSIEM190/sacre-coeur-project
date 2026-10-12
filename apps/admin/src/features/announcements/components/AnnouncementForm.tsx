import type { FormEvent } from 'react'
import { Plus } from 'lucide-react'
import type { ClassName } from '@sacre-coeur/domain/types'
import type { AnnouncementTarget } from '../types/announcement-form'

interface AnnouncementFormProps {
  classes: ClassName[]
  editing: string | null
  title: string
  body: string
  target: AnnouncementTarget
  isSaving: boolean
  onTitleChange: (value: string) => void
  onBodyChange: (value: string) => void
  onTargetChange: (value: AnnouncementTarget) => void
  onReset: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function AnnouncementForm({ classes, editing, title, body, target, isSaving, onTitleChange, onBodyChange, onTargetChange, onReset, onSubmit }: AnnouncementFormProps) {
  return <form onSubmit={onSubmit} className="mb-8 space-y-4 rounded-3xl border border-border bg-card p-6">
    <h2 className="font-display text-xl">{editing ? "Modifier l'annonce" : 'Nouvelle annonce'}</h2>
    <input value={title} onChange={event => onTitleChange(event.target.value)} required placeholder="Titre" className="w-full rounded-xl border border-border bg-background px-4 py-3" />
    <textarea value={body} onChange={event => onBodyChange(event.target.value)} required placeholder="Message…" rows={3} className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3" />
    <div className="flex items-center gap-1">
      <select value={target} onChange={event => onTargetChange(event.target.value as AnnouncementTarget)} className="w-full rounded-xl border border-border bg-background px-4 py-3"><option value="all">Toutes les classes</option>{classes.map(classe => <option key={classe.id} value={classe.id}>{classe.nom_classe}</option>)}</select>
      <input value="Auteur : Vous" disabled className="w-full cursor-not-allowed rounded-xl border border-border bg-muted px-4 py-3 text-muted-foreground" />
    </div>
    <div className="flex gap-3"><button type="submit" disabled={isSaving} className="flex items-center gap-2 rounded-full bg-sacred-red px-5 py-2.5 font-semibold text-white disabled:opacity-50"><Plus className="size-4" />{editing ? 'Mettre à jour' : 'Publier'}</button>{editing && <button type="button" onClick={onReset} className="rounded-full border border-border px-5 py-2.5 font-semibold">Annuler</button>}</div>
  </form>
}
