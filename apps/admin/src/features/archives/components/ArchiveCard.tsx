import type { FormEvent } from 'react'
import { Check, Download, Edit3, Loader2, Trash2, X } from 'lucide-react'
import type { ArchiveDocument, ArchiveDocumentUpdateInput } from '@sacre-coeur/domain/types'

interface ArchiveCardProps {
  archive: ArchiveDocument
  editing: boolean
  editForm: ArchiveDocumentUpdateInput
  isSaving: boolean
  isDeleting: boolean
  onEditFormChange: (form: ArchiveDocumentUpdateInput) => void
  onEditStart: () => void
  onEditCancel: () => void
  onUpdate: (event: FormEvent<HTMLFormElement>) => void
  onDownload: () => void
  onDelete: () => void
}

const CATEGORIES = ['Palmarès', 'Bulletin', 'Procès-Verbal', 'Autre'] as const
const inputClass = 'rounded-xl border border-border bg-background px-4 py-2 text-xs'

function ArchiveEditForm({ editForm, isSaving, onEditFormChange, onEditCancel, onUpdate }: Pick<ArchiveCardProps, 'editForm' | 'isSaving' | 'onEditFormChange' | 'onEditCancel' | 'onUpdate'>) {
  return (
    <form onSubmit={onUpdate} className="grid w-full gap-3 sm:grid-cols-2">
      <input required value={editForm.title} onChange={event => onEditFormChange({ ...editForm, title: event.target.value })} className={inputClass} />
      <input type="number" required value={editForm.year} onChange={event => onEditFormChange({ ...editForm, year: Number(event.target.value) })} className={inputClass} />
      <select value={editForm.category} onChange={event => onEditFormChange({ ...editForm, category: event.target.value as ArchiveDocument['category'] })} className={inputClass}>
        {CATEGORIES.map(category => <option key={category}>{category}</option>)}
      </select>
      <input type="file" onChange={event => onEditFormChange({ ...editForm, file: event.target.files?.[0] ?? null })} className="rounded-xl border border-border bg-background px-4 py-1.5 text-xs" />
      <textarea value={editForm.description} onChange={event => onEditFormChange({ ...editForm, description: event.target.value })} rows={2} className={inputClass + ' resize-none sm:col-span-2'} />
      <div className="flex items-center justify-end gap-2 pt-1 sm:col-span-2">
        <button type="button" disabled={isSaving} onClick={onEditCancel} className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"><X className="size-3" /> Annuler</button>
        <button type="submit" disabled={isSaving} className="flex items-center gap-1 rounded-full bg-sacred-red px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{isSaving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}Enregistrer</button>
      </div>
    </form>
  )
}

function ArchiveSummary({ archive, onEditStart, onDownload, onDelete, isDeleting }: Pick<ArchiveCardProps, 'archive' | 'onEditStart' | 'onDownload' | 'onDelete' | 'isDeleting'>) {
  return (
    <div className="flex w-full items-center justify-between gap-4">
      <div>
        <p className="font-semibold">{archive.title}</p>
        <p className="text-xs opacity-60"><span className="font-medium text-foreground">{archive.category}</span> · {archive.year}</p>
        {archive.description && <p className="mt-1 whitespace-pre-line rounded-lg border border-border/40 bg-background/50 p-2 text-xs opacity-80">{archive.description}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={onDownload} className="grid size-9 place-items-center rounded-full border border-border text-primary transition-colors hover:bg-muted" title="Télécharger l'archive"><Download className="size-4" /></button>
        <button type="button" onClick={onEditStart} className="grid size-9 place-items-center rounded-full border border-border text-primary transition-colors hover:bg-muted" title="Modifier l'archive"><Edit3 className="size-4" /></button>
        <button type="button" disabled={isDeleting} onClick={onDelete} className="grid size-9 place-items-center rounded-full border border-border transition-colors hover:bg-destructive hover:text-destructive-foreground disabled:opacity-40" title="Supprimer l'archive"><Trash2 className="size-4" /></button>
      </div>
    </div>
  )
}

export function ArchiveCard(props: ArchiveCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      {props.editing
        ? <ArchiveEditForm editForm={props.editForm} isSaving={props.isSaving} onEditFormChange={props.onEditFormChange} onEditCancel={props.onEditCancel} onUpdate={props.onUpdate} />
        : <ArchiveSummary archive={props.archive} isDeleting={props.isDeleting} onEditStart={props.onEditStart} onDownload={props.onDownload} onDelete={props.onDelete} />}
    </article>
  )
}
