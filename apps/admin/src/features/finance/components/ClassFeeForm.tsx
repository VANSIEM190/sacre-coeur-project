import type { FormEvent } from 'react'
import { Plus } from 'lucide-react'
import type { ClassName } from '@sacre-coeur/domain/types'
import type { ClassFeeFormState } from '../types/class-fee-form'

interface ClassFeeFormProps {
  classes: ClassName[]
  form: ClassFeeFormState
  schoolYear: string
  isSaving: boolean
  onFormChange: (form: ClassFeeFormState) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ClassFeeForm({ classes, form, schoolYear, isSaving, onFormChange, onSubmit }: ClassFeeFormProps) {
  return <form onSubmit={onSubmit} className="mb-8 grid gap-4 rounded-3xl border border-border bg-card p-6 sm:grid-cols-2">
    <select value={form.classId} onChange={event => onFormChange({ ...form, classId: event.target.value })} required className="rounded-xl border border-border bg-background px-4 py-3 text-sm"><option value="" disabled>Sélectionner une classe...</option>{classes.map(classe => <option key={classe.id} value={classe.id}>{classe.nom_classe}</option>)}</select>
    <select value={form.tranche} onChange={event => onFormChange({ ...form, tranche: Number(event.target.value) as 1 | 2 | 3 })} className="rounded-xl border border-border bg-background px-4 py-3 text-sm"><option value={1}>1ère Tranche</option><option value={2}>2ème Tranche</option><option value={3}>3ème Tranche</option></select>
    <select value={form.reason} onChange={event => onFormChange({ ...form, reason: event.target.value })} className="rounded-xl border border-border bg-background px-4 py-3 text-sm"><option value="Minerval">Minerval</option><option value="Frais d'inscription">Frais d'inscription</option><option value="Examen / Session">Examen / Session</option><option value="Autres frais">Autres frais</option></select>
    <div className="flex gap-2"><input type="number" value={form.amount} min="1" onChange={event => onFormChange({ ...form, amount: Number(event.target.value) })} required placeholder="Montant fixé" className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm" /><select value={form.currency} onChange={event => onFormChange({ ...form, currency: event.target.value as 'USD' | 'FC' })} className="shrink-0 rounded-xl border border-border bg-background px-3 py-3 text-sm font-semibold"><option value="USD">USD</option><option value="FC">FC</option></select></div>
    <input type="text" value={schoolYear} disabled readOnly className="cursor-not-allowed rounded-xl border border-border bg-background/50 px-4 py-3 text-sm text-foreground/60" placeholder="Année Scolaire" />
    <button type="submit" disabled={isSaving} className="flex items-center justify-center gap-2 rounded-full bg-sacred-red px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:col-span-2"><Plus className="size-4" />Fixer le tarif</button>
  </form>
}
