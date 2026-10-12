import { PageHeader } from '@sacre-coeur/ui/layouts/dashboard-shell'
import { CourseFilters } from '../components/CourseFilters'
import { CourseForm } from '../components/CourseForm'
import { CourseList } from '../components/CourseList'
import { useCoursesPage } from '../hooks/useCoursesPage'

function AdminCours() {
  const page = useCoursesPage()
  return (
    <div>
      <PageHeader title="Cours" subtitle="Publiez les supports de cours par classe." />
      <CourseFilters classes={page.classes} searchQuery={page.searchQuery} selectedClass={page.selectedClassFilter} onSearchChange={page.setSearchQuery} onClassChange={page.setSelectedClassFilter} />
      <CourseForm classes={page.classes} editingCourse={page.editingCourse} title={page.title} description={page.description} classId={page.classId} isSubmitting={page.isSubmitting} fileInputRef={page.fileInputRef} onTitleChange={page.setTitle} onDescriptionChange={page.setDescription} onClassChange={page.setClassId} onFileChange={page.setFile} onReset={page.resetForm} onSubmit={page.submit} />
      <CourseList courses={page.filteredCourses} classes={page.classes} downloadingId={page.downloadingId} onDownload={page.download} onEdit={page.startEdit} onDelete={page.remove} />
    </div>
  )
}

export default AdminCours
