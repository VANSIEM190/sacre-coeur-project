import { ArrowLeft, Loader2, Plus, Users } from 'lucide-react'
import StudentProfile from '@sacre-coeur/school-features/students/components/StudentProfile'
import { ChildrenList } from '../components/ChildrenList'
import { StudentFormDialog } from '../components/StudentFormDialog'
import { useParentChildren } from '../hooks/useParentChildren'
import { FormikFieldStyles } from '../../../shared/forms/FormikFields'

export default function ParentChildrenManager() {
  const page = useParentChildren()

  if (page.selectedStudent) return <div className="space-y-4">
    <button onClick={() => page.setSelectedStudent(null)} className="flex items-center gap-2 text-sm font-medium text-sacred-red transition-opacity hover:opacity-80"><ArrowLeft className="size-4" />Retour à la liste des élèves</button>
    <StudentProfile student={page.selectedStudent} />
  </div>

  return <div className="space-y-8">
    <header className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4"><div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sacred-red/10 text-sacred-red"><Users className="size-6" /></div><div><h2 className="font-display text-2xl">Mes enfants inscrits</h2><p className="text-sm opacity-60">Gérez le dossier scolaire de vos enfants.</p></div></div>
      <button onClick={() => { page.setEditingStudent(null); page.setIsModalOpen(true) }} className="inline-flex items-center justify-center gap-2 rounded-full bg-sacred-red px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sacred-red/20 transition-transform hover:scale-105"><Plus className="size-4" />Inscrire un enfant</button>
    </header>
    {page.isLoading ? <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-sacred-red" /></div> : page.children.length === 0 ? <div className="rounded-3xl border border-dashed border-border py-12 text-center opacity-60"><p className="text-sm">Aucun enfant n'est inscrit pour le moment.</p></div> : <ChildrenList children={page.children} classes={page.classes} isDeleting={page.deleteMutation.isPending} onSelect={page.setSelectedStudent} onEdit={student => { page.setEditingStudent(student); page.setIsModalOpen(true) }} onDelete={page.deleteStudent} />}
    <StudentFormDialog isOpen={page.isModalOpen} student={page.editingStudent} classes={page.classes} isSaving={page.isSaving} onClose={page.closeModal} onSubmit={page.submitStudent} />
    <FormikFieldStyles />
  </div>
}
