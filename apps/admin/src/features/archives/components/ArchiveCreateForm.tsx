import type { FormEvent } from 'react'
import { Loader2, Plus } from 'lucide-react'
import type { ArchiveCreateForm as FormValues } from '../types/archive-form'

interface ArchiveCreateFormProps {
  form: FormValues
  isSaving: boolean
  onFormChange: (form: FormValues) => void
  onFileChange: (file: File | null) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

const CATEGORIES = ['Palmarès', 'Bulletin', 'Procès-Verbal', 'Autre'] as const

export function ArchiveCreateForm({ form, isSaving, onFormChange, onFileChange, onSubmit }: ArchiveCreateFormProps) {
  return <form onSubmit={onSubmit} className="mb-8 grid gap-3 rounded-3xl border border-border bg-card p-6 sm:grid-cols-2"><div className="sm:col-span-2"><h2 className="mb-1 font-display text-xl">Nouvelle archive</h2></div><input required placeholder="Titre" value={form.title} onChange={event => onFormChange({ ...form, title: event.target.value })} className="rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none" /><input type="number" required placeholder="Année" value={form.year} onChange={event => onFormChange({ ...form, year: Number(event.target.value) })} className="rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none" /><select value={form.category} onChange={event => onFormChange({ ...form, category: event.target.value as FormValues['category'] })} className="rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none">{CATEGORIES.map(category => <option key={category}>{category}</option>)}</select><input type="file" required onChange={event => onFileChange(event.target.files?.[0] ?? null)} className="cursor-pointer rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none file:mr-4 file:rounded-full file:border-0 file:bg-muted file:px-3 file:py-1 file:text-xs file:font-semibold file:text-foreground hover:file:bg-muted/80" /><textarea placeholder="Description" value={form.description} onChange={event => onFormChange({ ...form, description: event.target.value })} rows={3} className="resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none sm:col-span-2" /><button type="submit" disabled={isSaving} className="flex items-center justify-center gap-2 rounded-full bg-sacred-red px-5 py-2.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:col-span-2">{isSaving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}{isSaving ? 'Archivage en cours...' : 'Archiver'}</button></form>
}
