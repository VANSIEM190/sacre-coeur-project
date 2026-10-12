import { useState } from 'react'
import { PageHeader } from '@sacre-coeur/ui/layouts/dashboard-shell'
import { Trash2, ArrowLeft, Plus, Loader2, Pencil } from 'lucide-react'
import type { ClassName, EleveDetails } from '@sacre-coeur/domain/types'
import { getCurrentSchoolYear } from '@sacre-coeur/domain/utils/getCurrentSchoolYear'
import StudentProfile from '@sacre-coeur/school-features/students/components/StudentProfile'
import { useAdminClasses } from '../hooks/useAdminClasses'
import { ClassFormDialog } from '../components/ClassFormDialog'
import { ClassStudentList } from '../components/ClassStudentList'

function AdminClasses() {
  const year = getCurrentSchoolYear()
  const [selected, setSelected] = useState<string | null>(null)
  const [selectedIdClasse, SetSelectedIdClasse] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [schoolYear, setSchoolYear] = useState(year)
  const [editingClass, setEditingClass] = useState<ClassName | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<EleveDetails | null>(null)
  const [studentSearchQuery, setStudentSearchQuery] = useState('')

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingClass(null)
    setNewClassName('')
    setSchoolYear(year)
  }
  const data = useAdminClasses(selectedIdClasse, closeModal)
  const classes = data.classesQuery.data ?? []
  const isLoading = data.classesQuery.isLoading
  const isError = data.classesQuery.isError
  const studentsData = data.studentsQuery.data ?? []
  const studentLoading = data.studentsQuery.isLoading
  const studentsError = data.studentsQuery.isError
  const createClassMutation = data.createClass
  const updateClassMutation = data.updateClass
  const deleteClassMutation = data.deleteClass

  const openCreateModal = () => {
    setEditingClass(null)
    setNewClassName('')
    setSchoolYear(year)
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

  const isSavingClass = createClassMutation.isPending || updateClassMutation.isPending

  if (selectedStudent) {
    return (
      <div>
        <button onClick={() => setSelectedStudent(null)} className="mb-4 flex items-center gap-2 text-sm opacity-60 hover:opacity-100">
          <ArrowLeft className="size-4" /> Retour à la classe
        </button>
        <StudentProfile student={selectedStudent} />
      </div>
    )
  }

  if (selected) {
    return studentLoading ? (
      <div className="flex flex-col items-center justify-center gap-3 py-24 opacity-60"><Loader2 className="size-8 animate-spin text-primary" /><p className="text-sm">Chargement des élèves...</p></div>
    ) : studentsError ? (
      <p role="alert" className="py-12 text-center text-sm text-destructive">Impossible de charger les élèves de cette classe.</p>
    ) : (
      <section className="space-y-4">
        <button onClick={() => { setSelected(null); SetSelectedIdClasse(''); setStudentSearchQuery('') }} className="mb-2 flex items-center gap-2 text-sm opacity-60 hover:opacity-100">
          <ArrowLeft className="size-4" /> Retour aux classes
        </button>
        <PageHeader title={selected} subtitle={`${studentsData.length} élève(s) dans cette classe`} />
        <ClassStudentList students={studentsData} searchQuery={studentSearchQuery} onSearchChange={setStudentSearchQuery} onSelectStudent={setSelectedStudent} />
      </section>
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

      <ClassFormDialog
        isOpen={isModalOpen}
        editingClass={editingClass}
        name={newClassName}
        schoolYear={schoolYear}
        isSaving={isSavingClass}
        onNameChange={setNewClassName}
        onSchoolYearChange={setSchoolYear}
        onClose={closeModal}
        onSubmit={handleSubmitClass}
      />
    </div>
  )
}

export default AdminClasses

