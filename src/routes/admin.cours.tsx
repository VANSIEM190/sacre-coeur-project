import { PageHeader } from '@/components/Dashboard-shell'
import { useState, useRef } from 'react'
import { Plus, Trash2, Search, Filter, Pencil, Download, X } from 'lucide-react'
import { classService } from '@/services/classe/classe.service'
import { adminCoursesServices } from '@/services/course/course.service'
import { useFetchData } from '@/hooks/useQuery'
import { filterElement } from '@/utils/filterElements'
import { downloadFile } from '@/utils/downloadFile'
import type { Course } from '@/lib/types'
import { SupabaseErrorHandler } from '@/services/core/Supabase.error.handler'

const BUCKET_NAME = 'sacre-coeur-files-courses'

function AdminCours() {
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

  // Cours en cours d'édition (null = mode création)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  // États de chargement, pour éviter double-clics et donner un retour visuel
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // États pour le système de filtrage
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClassFilter, setSelectedClassFilter] = useState('Tous')

  const { data: classes = [] } = useFetchData(
    ['studentClasses'],
    classService.getAllClasses
  )

  const filteredCourses = filterElement({
    items: serverCourses,
    keys: ['title', 'description'],
    searchQuery: searchQuery,
    selectKey: 'class_id',
    selectedValue: selectedClassFilter,
  })

  const resetForm = () => {
    setTitle('')
    setDesc('')
    setFile(null)
    setCls('')
    setEditingCourse(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const startEdit = (course: Course) => {
    setEditingCourse(course)
    setTitle(course.title)
    setDesc(course.description)
    setCls(course.class_id)
    setFile(null) // le fichier reste inchangé sauf si l'admin en choisit un nouveau
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // En création, le fichier est obligatoire ; en édition, il est optionnel
    if (!editingCourse && !file) {
      alert('Veuillez sélectionner un fichier valide.')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingCourse) {
        await adminCoursesServices.updateCourse(editingCourse.id, {
          title,
          description: desc,
          class_id: cls,
          ...(file ? { pdfUrl: file } : {}),
        })
      } else {
        await adminCoursesServices.createCourse({
          title,
          description: desc,
          class_id: cls,
          pdfUrl: file as File,
        })
      }

      resetForm()
      refetch()
    } catch (error) {
      console.error('Erreur lors de l’enregistrement du cours :', error)
      SupabaseErrorHandler.handle(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (courseId: string, filePath: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce cours ?')) {
      try {
        await adminCoursesServices.deleteCourse({ courseId, filePath })
        if (editingCourse?.id === courseId) resetForm()
        refetch()
      } catch (error) {
        console.error('Erreur lors de la suppression :', error)
        SupabaseErrorHandler.handle(error)
      }
    }
  }

  const handleDownload = async (course: Course) => {
    setDownloadingId(course.id)
    try {
      const ext = course.pdfUrl.split('.').pop()
      await downloadFile({
        bucket: BUCKET_NAME,
        filePath: course.pdfUrl,
        fileName: `${course.title}.${ext}`,
      })
    } catch (error) {
      console.error('Erreur lors du téléchargement :', error)
      SupabaseErrorHandler.handle(error)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Cours"
        subtitle="Publiez les supports de cours par classe."
      />

      {/* BLOC DE FILTRAGE */}
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

      {/* FORMULAIRE DE PUBLICATION / ÉDITION */}
      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-3xl bg-card border border-border mb-8 space-y-3"
      >
        {editingCourse && (
          <div className="flex items-center justify-between text-xs opacity-60 mb-1">
            <span>Modification de « {editingCourse.title} »</span>
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-1 underline"
            >
              <X className="size-3" /> Annuler
            </button>
          </div>
        )}
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
            required
            value={cls}
            onChange={e => setCls(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background"
          >
            <option value="" disabled>
              Choisir une classe
            </option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.nom_classe}
              </option>
            ))}
          </select>
          <input
            type="file"
            ref={fileInputRef}
            required={!editingCourse}
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-muted file:text-foreground hover:file:bg-muted/80 cursor-pointer"
          />
        </div>
        {editingCourse && (
          <p className="text-xs opacity-50">
            Laissez le champ fichier vide pour conserver le fichier actuel.
          </p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-full bg-sacred-red text-white font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          <Plus className="size-4" />
          {isSubmitting
            ? 'Enregistrement...'
            : editingCourse
              ? 'Mettre à jour'
              : 'Publier'}
        </button>
      </form>

      {/* LISTING DES COURS */}
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
                <div className="text-xs opacity-60">
                  {classes
                    .filter(cls => cls.id === c.class_id)
                    .map(rom => (
                      <span key={rom.id}>
                        {rom.nom_classe} · {c.description}
                      </span>
                    ))}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDownload(c)}
                  disabled={downloadingId === c.id}
                  className="size-9 rounded-full border border-border grid place-items-center hover:bg-muted transition-colors disabled:opacity-50"
                  title="Télécharger"
                >
                  <Download className="size-4" />
                </button>
                <button
                  onClick={() => startEdit(c)}
                  className="size-9 rounded-full border border-border grid place-items-center hover:bg-muted transition-colors"
                  title="Modifier"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => handleDelete(c.id, c.pdfUrl)}
                  className="size-9 rounded-full border border-border grid place-items-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AdminCours
