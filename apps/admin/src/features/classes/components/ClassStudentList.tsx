import { useMemo } from 'react'
import { Search } from 'lucide-react'
import type { EleveDetails } from '@sacre-coeur/domain/types'
import { filterElement } from '@sacre-coeur/domain/utils/filterElements'

interface ClassStudentListProps {
  students: EleveDetails[]
  searchQuery: string
  onSearchChange: (query: string) => void
  onSelectStudent: (student: EleveDetails) => void
}

export function ClassStudentList({ students, searchQuery, onSearchChange, onSelectStudent }: ClassStudentListProps) {
  const filteredStudents = useMemo(() => filterElement({
    items: students,
    keys: ['firstName', 'middleName', 'lastName', 'phone'],
    searchQuery,
  }), [students, searchQuery])

  return (
    <section className="space-y-4">
      <label className="relative block">
        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 opacity-50" />
        <input type="search" aria-label="Rechercher un élève" placeholder="Rechercher par nom, prénom ou téléphone" value={searchQuery} onChange={event => onSearchChange(event.target.value)} className="w-full rounded-xl border border-border bg-background py-2.5 pl-11 pr-4 text-sm focus:border-primary focus:outline-none" />
      </label>
      <ul className="space-y-2">
        {filteredStudents.map(student => <li key={student.id}>
          <button type="button" onClick={() => onSelectStudent(student)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/40">
            <span className="font-semibold">{[student.lastName, student.middleName, student.firstName].filter(Boolean).join(' ')}</span>
            <span className="text-xs opacity-60">{student.phone}</span>
          </button>
        </li>)}
        {!filteredStudents.length && <li className="rounded-2xl border border-dashed border-border py-10 text-center text-sm opacity-60">Aucun élève ne correspond à cette recherche.</li>}
      </ul>
    </section>
  )
}
