import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/Dashboard-shell'
import { useAuthStore } from '@/stores/auth-store'
import { classService } from '@/services/classe/classe.service'
import {
  Trash2,
  ArrowLeft,
  Plus,
  X,
  Loader2,
  Search,
  Pencil,
} from 'lucide-react'
import { SupabaseErrorHandler } from '@/services/core/Supabase.error.handler'
import { toast } from 'sonner'
import { useFetchData, useMutateData } from '@/hooks/useQuery'
import { filterElement } from '@/utils/filterElements'
import type { ClassName } from '@/lib/types'

function AdminClasses() {
  const queryClient = useQueryClient()
  // const users = useAuthStore(s => s.registeredUsers)
  const remove = useAuthStore(s => s.removeUser)
  const [selected, setSelected] = useState<string | null>(null)
  const [selectedIdClasse, SetSelectedIdClasse] = useState<string>('')

  // États pour le Modal (création ET édition)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [schoolYear, setSchoolYear] = useState('2026-2027')
  const [editingClass, setEditingClass] = useState<ClassName | null>(null)

  // État pour le filtrage des élèves
  const [studentSearchQuery, setStudentSearchQuery] = useState('')

  // 1. REQUÊTE : Récupération des classes avec TanStack Query
  const {
    data: classes = [],
    isLoading,
    isError,
  } = useFetchData(['classes'], classService.getAllClasses)

  // 2. REQUÊTE : Récupération des élèves par classe avec TanStack Query
  const {
    data: studentsData = [],
    isLoading: studentLoading,
    isError: studentsError,
  } = useFetchData(['studentClasses', selectedIdClasse], () =>
    classService.getStudentsInClass(selectedIdClasse)
  )

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingClass(null)
    setNewClassName('')
    setSchoolYear('2026-2027')
  }

  // 3. MUTATION : Création d'une classe avec TanStack Query
  const createClassMutation = useMutateData(
    ({ name, year }: { name: string; year: string }) =>
      classService.createClass(name, year),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['classes'] })
        toast.success('classe créee avec succès')
        closeModal()
      },
      onError: err => SupabaseErrorHandler.handle(err),
    }
  )

  // 3bis. MUTATION : Mise à jour d'une classe avec TanStack Query
  const updateClassMutation = useMutateData(
    ({ id, name, year }: { id: string; name: string; year: string }) =>
      classService.updateClass(id, {
        nom_classe: name,
        annee_scolaire: year,
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['classes'] })
        toast.success('classe mise à jour avec succès')
        closeModal()
      },
      onError: err => SupabaseErrorHandler.handle(err),
    }
  )

  // 4. MUTATION : Suppression d'une classe avec TanStack Query
  const deleteClassMutation = useMutateData(
    (classId: string) => classService.deleteClass(classId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['classes'] })
        toast.success('classe supprimée avec succès')
      },
      onError: err => SupabaseErrorHandler.handle(err),
    }
  )

  const openCreateModal = () => {
    setEditingClass(null)
    setNewClassName('')
    setSchoolYear('2026-2027')
    setIsModalOpen(true)
  }

  const openEditModal = (e: React.MouseEvent, classe: ClassName) => {
    e.stopPropagation()
    setEditingClass(classe)
    setNewClassName(classe.nom_classe)
    setSchoolYear(classe.annee_scolaire)
    setIsModalOpen(true)
  }

  const handleSubmitClass = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClassName.trim()) return

    if (editingClass) {
      updateClassMutation.mutate({
        id: editingClass.id,
        name: newClassName,
        year: schoolYear,
      })
    } else {
      createClassMutation.mutate({ name: newClassName, year: schoolYear })
    }
  }

  const handleDeleteClass = (
    e: React.MouseEvent,
    classId: string,
    className: string
  ) => {
    e.stopPropagation()
    if (confirm(`Voulez-vous vraiment supprimer la classe ${className} ?`)) {
      deleteClassMutation.mutate(classId)
    }
  }
  // Logique de filtrage textuelle sur la liste filtrée par classe
  const list = studentsData.filter(s => s.classe_id === selectedIdClasse)

  const filteredStudents = useMemo(() => {
    return filterElement({
      items: list,
      keys: ['firstName', 'middleName', 'lastName', 'phone'],
      searchQuery: studentSearchQuery,
    })
  }, [list, studentSearchQuery])

  const isSavingClass =
    createClassMutation.isPending || updateClassMutation.isPending

  if (selected) {
    return studentLoading ? (
      <div className="flex flex-col items-center justify-center py-24 gap-3 opacity-60">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm">Chargement des élèves...</p>
      </div>
    ) : studentsError ? (
      <div className="text-center py-12 text-destructive">
        <p className="text-sm">
          Une erreur est survenue lors de la récupération des données.
        </p>
      </div>
    ) : (
      <div>
        <button
          onClick={() => {
            setSelected(null)
            SetSelectedIdClasse('')
            setStudentSearchQuery('') // Réinitialisation propre à la fermeture
          }}
          className="text-sm opacity-60 hover:opacity-100 flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="size-4" /> Retour aux classes
        </button>
        <PageHeader
          title={selected}
          subtitle={`${filteredStudents.length} élève(s) trouvé(s)`}
        />

        {/* ZONE DE FILTRAGE DES ÉLÈVES (Design copié sur le système de filtre existant) */}
        <div className="p-5 rounded-3xl bg-card border border-border mb-6">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 opacity-50" />
            <input
              type="text"
              placeholder="Rechercher un élève par nom, prénom, téléphone..."
              value={studentSearchQuery}
              onChange={e => setStudentSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          {filteredStudents.map(s => (
            <div
              key={s.id}
              className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between"
            >
              <div>
                <p className="font-semibold">
                  {s.lastName} {s.middleName} {s.firstName}
                </p>
                <p className="text-xs opacity-60">phone : {s.phone}</p>
              </div>
              <button
                onClick={() =>
                  confirm(
                    `Supprimer ${s.lastName} ${s.middleName} ${s.firstName} ?`
                  ) && remove(s.id)
                }
                className="size-9 rounded-full border border-border grid place-items-center hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          {filteredStudents.length === 0 && (
            <p className="text-sm opacity-60 text-center py-12 border border-dashed border-border rounded-2xl">
              Aucun élève ne correspond à vos critères de recherche.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <PageHeader
          title="Classes"
          subtitle="Cliquez sur une classe pour voir les élèves."
        />
        <button
          onClick={openCreateModal}
          className="h-11 px-5 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity self-start sm:self-auto"
        >
          <Plus className="size-5" />
          Créer une classe
        </button>
      </div>

      {/* Gestion des états de TanStack Query */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 opacity-60">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm">Chargement des classes...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-destructive">
          <p className="text-sm">
            Une erreur est survenue lors de la récupération des données.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(c => (
            <div
              key={c.id}
              onClick={() => {
                setSelected(c.nom_classe)
                SetSelectedIdClasse(c.id)
              }}
              className="p-6 rounded-3xl bg-card border border-border text-left hover:shadow-xl hover:-translate-y-1 transition-all flex items-start justify-between group"
            >
              <div>
                <p className="font-display text-2xl mb-2">{c.nom_classe}</p>
                <p className="text-sm opacity-60">
                  {c.studentCount} élève{c.studentCount > 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Bouton Modifier la classe */}
                <button
                  onClick={e => openEditModal(e, c)}
                  className="size-8 rounded-full border border-border grid place-items-center hover:bg-muted transition-all"
                  title="Modifier"
                >
                  <Pencil className="size-4" />
                </button>

                {/* Bouton Supprimer la classe */}
                <button
                  disabled={deleteClassMutation.isPending}
                  onClick={e => handleDeleteClass(e, c.id, c.nom_classe)}
                  className="size-8 rounded-full border border-border grid place-items-center hover:bg-destructive hover:text-destructive-foreground transition-all disabled:opacity-40"
                  title="Supprimer"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}

          {classes.length === 0 && (
            <div className="col-span-full text-center py-12 border border-dashed border-border rounded-3xl opacity-60">
              <p className="text-sm">
                Aucune classe enregistrée pour le moment.
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODAL (création ET édition) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border p-6 relative shadow-2xl">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 rounded-full opacity-60 hover:opacity-100 hover:bg-muted transition-colors"
            >
              <X className="size-5" />
            </button>

            <h3 className="font-display text-2xl mb-1">
              {editingClass ? 'Modifier la classe' : 'Nouvelle classe'}
            </h3>
            <p className="text-sm opacity-60 mb-6">
              {editingClass
                ? `Modifiez les informations de « ${editingClass.nom_classe} ».`
                : "Ajoutez une nouvelle classe pour l'année en cours."}
            </p>

            <form onSubmit={handleSubmitClass} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider opacity-60 block mb-2">
                  Nom de la classe
                </label>
                <input
                  type="text"
                  placeholder="Ex: 7ème Secondaire, Terminale C"
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:outline-none focus:border-primary text-sm"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider opacity-60 block mb-2">
                  Année Scolaire
                </label>
                <input
                  type="text"
                  placeholder="2026-2027"
                  value={schoolYear}
                  onChange={e => setSchoolYear(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:outline-none focus:border-primary text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-11 px-4 rounded-xl border border-border font-medium text-sm hover:bg-muted transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingClass}
                  className="h-11 px-5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingClass && <Loader2 className="size-4 animate-spin" />}
                  {editingClass ? 'Mettre à jour' : 'Enregistrer la classe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminClasses
