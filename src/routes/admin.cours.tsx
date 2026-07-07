import { PageHeader } from '@/components/Dashboard-shell'
import { useState, useRef } from 'react'
import { Plus, Trash2, Search, Filter } from 'lucide-react'
import { classService } from '@/services/classe/classe.service'
import { adminCoursesServices } from '@/services/course/course.service'
import { useFetchData } from '@/hooks/useQuery'
import { filterElement } from '@/utils/filterElements'

function AdminCours() {
  // 1. Récupération des données dynamiques via le hook TanStack Query
  const { data: serverCourses = [], refetch } = useFetchData(
    ['adminCourses'],
    () => adminCoursesServices.getCourses()
  )

  // États du formulaire
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [cls, setCls] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // États pour le système de filtrage
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClassFilter, setSelectedClassFilter] = useState('Tous')

  const { data: classes = [] } = useFetchData(
    ['studentClasses'],
    classService.getAllClasses
  )
  console.log(cls)

  const filteredCourses = filterElement({
    items: serverCourses,
    keys: ['title', 'description'],
    searchQuery: searchQuery,
    selectKey: 'class_id',
    selectedValue: selectedClassFilter,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      alert('Veuillez sélectionner un fichier valide.')
      return
    }

    try {
      await adminCoursesServices.createCourse({
        title,
        description: desc,
        class_id: cls,
        pdfUrl: file,
      })

      setTitle('')
      setDesc('')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''

      // Rafraîchissement des données du cache TanStack Query
      refetch()
    } catch (error) {
      console.error('Erreur lors de la création du cours :', error)
    }
  }

  const handleDelete = async (courseId: string, filePath: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce cours ?')) {
      try {
        await adminCoursesServices.deleteCourse({ courseId, filePath })
        refetch()
      } catch (error) {
        console.error('Erreur lors de la suppression :', error)
      }
    }
  }

  return (
    <div>
      <PageHeader
        title="Cours"
        subtitle="Publiez les supports de cours par classe."
      />

      {/* BLOC DE FILTRAGE TECHNIQUE (Intégré de manière fluide au design existant) */}
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

      {/* FORMULAIRE DE PUBLICATION */}
      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-3xl bg-card border border-border mb-8 space-y-3"
      >
        <input
          required
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Titre du cours"
          className="w-full px-4 py-3 rounded-xl border border-border bg-background"
        />
        <textarea
          required
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Description"
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background resize-none"
        />
        <div className="flex items-center gap-2">
          <select
            value={cls}
            onChange={e => setCls(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.nom_classe}
              </option>
            ))}
          </select>
          <input
            type="file"
            ref={fileInputRef}
            required
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-muted file:text-foreground hover:file:bg-muted/80 cursor-pointer"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-full bg-sacred-red text-white font-semibold flex items-center gap-2"
        >
          <Plus className="size-4" /> Publier
        </button>
      </form>

      {/* LISTING DES COURS FILTRÉS ET SÉCURISÉS */}
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
                onClick={() => handleDelete(c.id, c.pdfUrl)}
                className="size-9 rounded-full border border-border grid place-items-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AdminCours
