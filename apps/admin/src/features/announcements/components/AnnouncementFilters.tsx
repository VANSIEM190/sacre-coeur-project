import { Search } from 'lucide-react'
import type { ClassName } from '@sacre-coeur/domain/types'

interface AnnouncementFiltersProps {
  classes: ClassName[]
  searchQuery: string
  filterClass: string
  onSearchChange: (value: string) => void
  onClassChange: (value: string) => void
}

export function AnnouncementFilters({ classes, searchQuery, filterClass, onSearchChange, onClassChange }: AnnouncementFiltersProps) {
  return <div className="mb-6 flex flex-col gap-3 sm:flex-row">
    <div className="relative flex-1"><Search className="absolute left-4 top-3.5 size-4 text-muted-foreground opacity-50" /><input type="text" value={searchQuery} onChange={event => onSearchChange(event.target.value)} placeholder="Rechercher une annonce..." className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4" /></div>
    <select value={filterClass} onChange={event => onClassChange(event.target.value)} className="min-w-45 rounded-xl border border-border bg-background px-4 py-3"><option value="all">Toutes les cibles</option>{classes.map(classe => <option key={classe.id} value={classe.id}>Classe : {classe.nom_classe}</option>)}</select>
  </div>
}
