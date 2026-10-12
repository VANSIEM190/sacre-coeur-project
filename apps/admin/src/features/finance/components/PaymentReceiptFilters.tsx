import { Filter } from 'lucide-react'

interface PaymentReceiptFiltersProps {
  search: string
  year: string
  onSearchChange: (value: string) => void
  onYearChange: (value: string) => void
}

export function PaymentReceiptFilters({ search, year, onSearchChange, onYearChange }: PaymentReceiptFiltersProps) {
  return <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center"><h2 className="font-display text-2xl">Reçus émis</h2><div className="flex flex-wrap items-center gap-2"><div className="relative flex-1 sm:flex-initial"><Filter className="absolute left-3 top-3 size-4 opacity-40" /><input type="text" placeholder="Filtrer par élève, reçu, motif..." value={search} onChange={event => onSearchChange(event.target.value)} className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-4 text-xs sm:w-64" /></div><select value={year} onChange={event => onYearChange(event.target.value)} className="rounded-xl border border-border bg-card px-3 py-2 text-xs"><option value="all">Toutes les années</option><option value="2025-2026">2025-2026</option><option value="2024-2025">2024-2025</option><option value="2023-2024">2023-2024</option></select></div></div>
}
