import { Loader2 } from 'lucide-react'
import { PageHeader } from '@sacre-coeur/ui/layouts/dashboard-shell'
import { ArchiveFilters } from '../components/ArchiveFilters'
import { ArchiveCreateForm } from '../components/ArchiveCreateForm'
import { ArchiveCard } from '../components/ArchiveCard'
import { useArchivesPage } from '../hooks/useArchivesPage'

function AdminArchives() {
  const page = useArchivesPage()
  return <div>
    <PageHeader title="Archives" subtitle="Coffre-fort numérique des documents de l'école." />
    <ArchiveFilters searchQuery={page.searchQuery} category={page.selectedCategory} onSearchChange={page.setSearchQuery} onCategoryChange={page.setSelectedCategory} />
    <ArchiveCreateForm form={page.form} isSaving={page.createMutation.isPending} onFormChange={page.setForm} onFileChange={page.setFile} onSubmit={page.submitCreate} />
    {page.isLoading && <div className="flex flex-col items-center justify-center gap-2 py-12 opacity-70"><Loader2 className="size-8 animate-spin text-sacred-red" /><p className="text-sm">Chargement du coffre-fort numérique...</p></div>}
    {page.isError && <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive">Erreur lors du chargement des archives : {page.error instanceof Error ? page.error.message : 'Erreur inconnue'}</div>}
    {!page.isLoading && !page.isError && <div className="space-y-2">{page.filteredItems.map(archive => <ArchiveCard key={archive.id} archive={archive} editing={page.editingId === archive.id} editForm={page.editForm} isSaving={page.updateMutation.isPending} isDeleting={page.deleteMutation.isPending} onEditFormChange={page.setEditForm} onEditStart={() => page.startEdit(archive)} onEditCancel={() => page.setEditingId(null)} onUpdate={event => page.submitUpdate(event, archive.id)} onDownload={() => page.download(archive.file, archive.title)} onDelete={() => confirm(`Voulez-vous vraiment supprimer l'archive "${archive.title}" ?`) && page.deleteMutation.mutate({ archiveId: archive.id, filePath: archive.file })} />)}{page.filteredItems.length === 0 && <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm opacity-50">Aucune archive ne correspond à vos critères de recherche.</p>}</div>}
  </div>
}

export default AdminArchives
