import { Search } from 'lucide-react'

interface ArchiveFiltersProps {
  searchQuery: string
  category: string
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
}

const CATEGORIES = ['Palmarès', 'Bulletin', 'Procès-Verbal', 'Autre']

export function ArchiveFilters({ searchQuery, category, onSearchChange, onCategoryChange }: ArchiveFiltersProps) {
  return <div className="mb-6 space-y-4 rounded-3xl border border-border bg-card p-5"><div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"><div className="relative flex-1"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 opacity-50" /><input type="text" placeholder="Rechercher une archive par titre, année, description..." value={searchQuery} onChange={event => onSearchChange(event.target.value)} className="w-full rounded-xl border border-border bg-background py-2.5 pl-11 pr-4 text-sm focus:border-primary focus:outline-none" /></div><select value={category} onChange={event => onCategoryChange(event.target.value)} className="min-w-40 rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"><option value="Tous">Toutes les catégories</option>{CATEGORIES.map(item => <option key={item} value={item}>{item}</option>)}</select></div></div>
}
