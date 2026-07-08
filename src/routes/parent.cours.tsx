import { PageHeader } from '@/components/Dashboard-shell'
import { Download, Search, Filter } from 'lucide-react'
import { useState } from 'react'
import { classService } from '@/services/classe/classe.service'
import { adminCoursesServices } from '@/services/course/course.service'
import { useFetchData } from '@/hooks/useQuery'
import { filterElement } from '@/utils/filterElements'

const fakeDownload = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function StudentCours() {
  // États pour le système de filtrage
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClassFilter, setSelectedClassFilter] = useState('Tous')

  const { data: classes = [] } = useFetchData(
    ['studentClasses'],
    classService.getAllClasses
  )

  const { data: serverCourses = [] } = useFetchData(['adminCourses'], () =>
    adminCoursesServices.getCourses()
  )

  const filteredCourses = filterElement({
    items: serverCourses,
    keys: ['title', 'description'],
    searchQuery: searchQuery,
    selectKey: 'class_id',
    selectedValue: selectedClassFilter,
  })
  return (
    <div>
      <PageHeader title="Mes cours" subtitle={'parent'} />
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 size-4 opacity-40" />
          <input
            type="text"
            placeholder="Rechercher un cours..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="relative min-w-50">
          <Filter className="absolute left-4 top-3.5 size-4 opacity-40" />
          <select
            value={selectedClassFilter}
            onChange={e => setSelectedClassFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-primary appearance-none cursor-pointer"
          >
            <option value="Tous">Toutes les classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.nom_classe}>
                {c.nom_classe}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-3">
        {filteredCourses.length === 0 ? (
          <p className="text-sm opacity-50 text-center py-6">
            Aucun support de cours trouvé.
          </p>
        ) : (
          filteredCourses.map(c => (
            <div
              key={c.id}
              className="p-4 rounded-2xl bg-card border border-border flex items-start justify-between gap-4"
            >
              <div>
                <p className="font-semibold">{c.title}</p>
                <p className="text-xs opacity-60">
                  {classes
                    .filter(cls => cls.id === c.class_id)
                    .map(rom => (
                      <p className="text-xs opacity-60">
                        {rom.nom_classe} · {c.description}{' '}
                      </p>
                    ))}
                </p>
              </div>
              <button
                onClick={() => fakeDownload(c.pdfUrl, c.title)}
                className="size-9 rounded-full border border-border grid place-items-center hover:bg-muted text-primary transition-colors"
                title="Télécharger l'archive"
              >
                <Download className="size-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default StudentCours
