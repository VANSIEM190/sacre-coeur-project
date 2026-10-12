import { PageHeader } from '@sacre-coeur/ui/layouts/dashboard-shell'
import { AnnouncementFilters } from '../components/AnnouncementFilters'
import { AnnouncementForm } from '../components/AnnouncementForm'
import { AnnouncementList } from '../components/AnnouncementList'
import { useAnnouncementsPage } from '../hooks/useAnnouncementsPage'

function AdminAnnonces() {
  const page = useAnnouncementsPage()
  if (!page.admin) return <div className="p-6 text-center text-destructive">Accès restreint. Veuillez vous connecter.</div>

  return <div>
    <PageHeader title="Annonces" subtitle="Communiquez en temps réel avec les élèves." />
    <AnnouncementFilters classes={page.classes} searchQuery={page.searchQuery} filterClass={page.filterClass} onSearchChange={page.setSearchQuery} onClassChange={page.setFilterClass} />
    <AnnouncementForm classes={page.classes} editing={page.editing} title={page.title} body={page.body} target={page.target} isSaving={page.createMutation.isPending || page.updateMutation.isPending} onTitleChange={page.setTitle} onBodyChange={page.setBody} onTargetChange={page.setTarget} onReset={page.reset} onSubmit={page.submit} />
    <AnnouncementList announcements={page.filteredAnnouncements} isLoading={page.announcementsQuery.isLoading} isError={page.announcementsQuery.isError} error={page.announcementsQuery.error} isDeleting={page.deleteMutation.isPending} onEdit={page.startEdit} onDelete={page.remove} />
  </div>
}

export default AdminAnnonces
