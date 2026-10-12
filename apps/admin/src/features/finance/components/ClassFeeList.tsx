import { DollarSign, Filter, Settings } from 'lucide-react'
import type { ClassFeeConfig } from '@sacre-coeur/domain/types'

interface ClassFeeListProps {
  configs: ClassFeeConfig[]
  years: string[]
  search: string
  selectedYear: string
  onSearchChange: (value: string) => void
  onYearChange: (value: string) => void
}

export function ClassFeeList({ configs, years, search, selectedYear, onSearchChange, onYearChange }: ClassFeeListProps) {
  return <>
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center"><h2 className="font-display text-2xl">Frais Configurés</h2><div className="flex flex-wrap items-center gap-2"><div className="relative flex-1 sm:flex-initial"><Filter className="absolute left-3 top-3 size-4 opacity-40" /><input type="text" placeholder="Filtrer par classe, motif..." value={search} onChange={event => onSearchChange(event.target.value)} className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-4 text-xs sm:w-64" /></div><select value={selectedYear} onChange={event => onYearChange(event.target.value)} className="rounded-xl border border-border bg-card px-3 py-2 text-xs"><option value="all">Toutes les années</option>{years.map(year => <option key={year}>{year}</option>)}</select></div></div>
    <div className="space-y-3">{configs.length === 0 ? <p className="rounded-2xl border border-dashed border-border py-6 text-center text-sm opacity-50">Aucun tarif fixé pour cette sélection.</p> : configs.map(config => <article key={config.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4"><div className="flex items-center gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sacred-red/10 text-sacred-red"><Settings className="size-5" /></div><div><p className="text-sm font-semibold">{config.className}</p><p className="text-xs opacity-60">Année : {config.schoolYear}</p><span className="mt-1 inline-block rounded bg-border px-2 py-0.5 text-[10px] font-medium opacity-80">{config.reason}</span></div></div><div className="flex items-center gap-1 whitespace-nowrap rounded-xl border border-border bg-background px-3 py-1.5 text-sm font-semibold"><DollarSign className="size-3.5 opacity-60" /><span>{config.amount} {config.currency}</span></div></article>)}</div>
  </>
}
