import type { FormEvent, RefObject } from 'react'
import { Plus, Search } from 'lucide-react'
import type { StudentSuggestion } from '../types/payment-form'

interface PaymentReceiptFormProps {
  suggestions: StudentSuggestion[]
  dropdownRef: RefObject<HTMLDivElement | null>
  studentSearch: string
  studentId: string
  isDropdownOpen: boolean
  tranche: 1 | 2 | 3
  currency: 'USD' | 'FC'
  amount: number
  cashier: string
  schoolYear: string
  reason: string
  isSaving: boolean
  onStudentSearch: (value: string) => void
  onStudentSelect: (student: StudentSuggestion) => void
  onDropdownToggle: (open: boolean) => void
  onTrancheChange: (value: 1 | 2 | 3) => void
  onCurrencyChange: (value: 'USD' | 'FC') => void
  onAmountChange: (value: number) => void
  onCashierChange: (value: string) => void
  onReasonChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function PaymentReceiptForm({ dropdownRef, ...props }: PaymentReceiptFormProps) {
  return <form onSubmit={props.onSubmit} className="mb-8 grid gap-4 rounded-3xl border border-border bg-card p-6 sm:grid-cols-2">
    <div ref={dropdownRef} className="relative flex flex-col sm:col-span-2 md:col-span-1"><div className="relative"><Search className="absolute left-3 top-3.5 size-4 opacity-40" /><input type="text" placeholder="Rechercher un élève par nom..." value={props.studentSearch} onFocus={() => props.onDropdownToggle(true)} onChange={event => props.onStudentSearch(event.target.value)} required className="w-full rounded-xl border border-border bg-background py-3 pl-9 pr-4 text-sm focus:border-sacred-red focus:outline-none" /></div>{props.isDropdownOpen && <div className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-card shadow-lg">{props.suggestions.length === 0 ? <div className="px-4 py-3 text-xs opacity-50">Aucun élève trouvé</div> : props.suggestions.map(suggestion => <button key={suggestion.student.id} type="button" onClick={() => props.onStudentSelect(suggestion)} className="flex w-full items-center justify-between border-b border-border/40 px-4 py-2.5 text-left text-sm transition-colors last:border-0 hover:bg-background/80"><span className="font-medium">{suggestion.fullName}</span><span className="rounded-md bg-border/40 px-2 py-0.5 text-xs opacity-50">{suggestion.student.currentClassName || 'Sans classe'}</span></button>)}</div>}<input type="hidden" value={props.studentId} required /></div>
    <select value={props.tranche} onChange={event => props.onTrancheChange(Number(event.target.value) as 1 | 2 | 3)} className="rounded-xl border border-border bg-background px-4 py-3 text-sm"><option value={1}>Tranche 1</option><option value={2}>Tranche 2</option><option value={3}>Tranche 3</option></select>
    <input value={props.schoolYear} disabled readOnly className="cursor-not-allowed rounded-xl border border-border bg-background/50 px-4 py-3 text-sm text-foreground/60" placeholder="Année Scolaire" />
    <select value={props.reason} onChange={event => props.onReasonChange(event.target.value)} className="rounded-xl border border-border bg-background px-4 py-3 text-sm"><option value="Minerval">Minerval</option><option value="Frais d'inscription">Frais d'inscription</option><option value="Examen / Session">Examen / Session</option><option value="Autres frais">Autres frais</option></select>
    <div className="flex gap-2"><input type="number" value={props.amount} min="1" onChange={event => props.onAmountChange(Number(event.target.value))} required placeholder="Montant" className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm" /><select value={props.currency} onChange={event => props.onCurrencyChange(event.target.value as 'USD' | 'FC')} className="shrink-0 rounded-xl border border-border bg-background px-3 py-3 text-sm font-semibold"><option value="USD">USD</option><option value="FC">FC</option></select></div>
    <input type="text" value={props.cashier} onChange={event => props.onCashierChange(event.target.value)} required placeholder="Nom du caissier" className="rounded-xl border border-border bg-background px-4 py-3 text-sm sm:col-span-2 md:col-span-1" />
    <button type="submit" disabled={props.isSaving} className="flex items-center justify-center gap-2 rounded-full bg-sacred-red px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:col-span-2"><Plus className="size-4" />Générer le reçu</button>
  </form>
}
