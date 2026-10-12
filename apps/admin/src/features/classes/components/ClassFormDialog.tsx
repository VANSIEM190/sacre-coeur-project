import type { FormEvent } from 'react'
import type { ClassName } from '@sacre-coeur/domain/types'
import { Loader2, X } from 'lucide-react'

interface ClassFormDialogProps {
  isOpen: boolean
  editingClass: ClassName | null
  name: string
  schoolYear: string
  isSaving: boolean
  onNameChange: (value: string) => void
  onSchoolYearChange: (value: string) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ClassFormDialog({ isOpen, editingClass, name, schoolYear, isSaving, onNameChange, onSchoolYearChange, onClose, onSubmit }: ClassFormDialogProps) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <button type="button" onClick={onClose} aria-label="Fermer" className="absolute right-4 top-4 rounded-full p-2 opacity-60 transition-colors hover:bg-muted hover:opacity-100"><X className="size-5" /></button>
        <h2 className="mb-1 font-display text-2xl">{editingClass ? 'Modifier la classe' : 'Nouvelle classe'}</h2>
        <p className="mb-6 text-sm opacity-60">{editingClass ? `Modifiez les informations de « ${editingClass.nom_classe} ».` : "Ajoutez une nouvelle classe pour l'année en cours."}</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider opacity-60">Nom de la classe
            <input type="text" maxLength={100} placeholder="Ex: 7ème Secondaire, Terminale C" value={name} onChange={event => onNameChange(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm focus:border-primary focus:outline-none" autoFocus required />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider opacity-60">Année scolaire
            <input type="text" maxLength={20} placeholder="2026-2027" value={schoolYear} onChange={event => onSchoolYearChange(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm focus:border-primary focus:outline-none" required />
          </label>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="h-11 rounded-xl border border-border px-4 text-sm font-medium transition-colors hover:bg-muted">Annuler</button>
            <button type="submit" disabled={isSaving} className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
              {isSaving && <Loader2 className="size-4 animate-spin" />}{editingClass ? 'Mettre à jour' : 'Enregistrer la classe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
