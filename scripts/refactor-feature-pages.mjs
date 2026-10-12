import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const read = path => fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n')
const write = (path, source) => fs.writeFileSync(path, source)
const marker = (source, text) => {
  const index = source.indexOf(text)
  if (index < 0) throw new Error(`Missing marker: ${text}`)
  return index
}
const original = file => {
  let source = execFileSync('git', ['show', `HEAD:src/routes/${file}.tsx`], { encoding: 'utf8' }).replace(/\r\n/g, '\n')
  for (const [from, to] of [
    ['@/components/Dashboard-shell', '@sacre-coeur/ui/layouts/dashboard-shell'],
    ['@/components/dashboard-shell', '@sacre-coeur/ui/layouts/dashboard-shell'],
    ['@/lib/types', '@sacre-coeur/domain/types'],
    ['@/hooks/useQuery', '@sacre-coeur/data-access/hooks/useQuery'],
    ['@/stores/auth-store', '@sacre-coeur/auth/stores/auth-store'],
    ['@/services/core/Supabase.error.handler', '@sacre-coeur/school-features/feedback/supabase-error-handler'],
    ['@/services/', '@sacre-coeur/data-access/services/'],
    ['@/utils/', '@sacre-coeur/domain/utils/'],
    ['@/lib/generateSchedulePdf', '@sacre-coeur/school-features/pdf/generateSchedulePdf'],
  ]) source = source.replaceAll(from, to)
  return source
}

{
  let source = original('teacher.classes')
  source = source.slice(marker(source, '  if (selected) {'))
  const names = 'selected, setSelected, setSelectedIdClasse, studentSearchQuery, setStudentSearchQuery, gradeModalStudent, setGradeModalStudent, selectedSubject, teacherSubjects, tranche, score, setScore, maxScore, setMaxScore, isLoadingStudents, isStudentsError, filteredStudents, isLoadingSubjects, isLoadingGrade, existingGrade, saveGradeMutation, handleOpenGradeModal, handleSaveGrade, isLoadingClasses, isClassesError, assignedClasses, changeSubject, changeTranche'
  source = `import { PageHeader } from '@sacre-coeur/ui/layouts/dashboard-shell'\nimport { ArrowLeft, Loader2, Search, X } from 'lucide-react'\nimport { useTeacherClasses } from '../hooks/useTeacherClasses'\n\nfunction TeacherClasses() {\n  const { ${names} } = useTeacherClasses()\n\n` + source
  source = source.replace('setSubject(e.target.value)', 'changeSubject(e.target.value)').replace('setTranche(Number(e.target.value) as 1 | 2 | 3)', 'changeTranche(Number(e.target.value) as 1 | 2 | 3)')
  source = source.replace('isLoadingClasses || isLoadingTeacher', 'isLoadingClasses')
  source = source.replace('disabled={saveGradeMutation.isPending}', 'disabled={saveGradeMutation.isPending || isLoadingGrade || isLoadingSubjects || teacherSubjects.length === 0}')
  write('apps/site/src/features/classes/pages/TeacherClassesPage.tsx', source)
}

{
  let source = original('teacher.horaires')
  source = source.replace("import { useAuthStore } from '@sacre-coeur/auth/stores/auth-store'\n", '').replace("import { classService } from '@sacre-coeur/data-access/services/classe/classe.service'\n", '').replace('ScheduleEntry, ClassName, TeacherUser', 'ScheduleEntry, ClassName')
  source = source.replace("import jsPDF from 'jspdf'", "import { generateSchedulePdf } from '@sacre-coeur/school-features/pdf/generateSchedulePdf'\nimport { useTeacherAssignments } from '../../classes/hooks/useTeacherAssignments'\nimport { SupabaseErrorHandler } from '@sacre-coeur/school-features/feedback/supabase-error-handler'")
  source = source.replace(/const DAYS: ScheduleEntry\['dayOfWeek'\]\[\] = \[[\s\S]*?\]\n/, "import { SCHOOL_DAYS as DAYS, filterScheduleEntries } from '@sacre-coeur/school-features/schedules/schedule-view'\n")
  let start = marker(source, '  // 1. Récupération')
  let end = marker(source, '  // États pour la navigation')
  source = source.slice(0, start) + "  const { assignedClasses: myClasses, isLoading: isLoadingClasses, error: assignmentsError, schoolYear } = useTeacherAssignments()\n\n" + source.slice(end)
  start = marker(source, '  // 2. Chargement'); end = marker(source, '  // 4. Chargement')
  source = source.slice(0, start) + source.slice(end)
  source = source.replace('{ data: schedule = [], isLoading: isLoadingSchedule }', '{ data: schedule = [], isLoading: isLoadingSchedule, error: scheduleError }')
  source = source.replace('{ enabled: !!selectedClass?.id }', '{ enabled: !!selectedClass?.id && myClasses.some(schoolClass => schoolClass.id === selectedClass.id) }')
  start = marker(source, '  // 5. Filtrage'); end = marker(source, '  // Écran de chargement')
  source = source.slice(0, start) + `  const filteredSchedule = useMemo(() => filterScheduleEntries(schedule, searchQuery), [schedule, searchQuery])
  const [isDownloading, setIsDownloading] = useState(false)
  const handleDownloadPDF = async (targetClass: ClassName) => {
    setIsDownloading(true)
    try { await generateSchedulePdf({ targetClass, schoolYear, schedule }) }
    catch (error) { SupabaseErrorHandler.handle(error) }
    finally { setIsDownloading(false) }
  }

` + source.slice(end)
  source = source.replace('  // VUE ÉTAPE 2', '  if (assignmentsError) return <p className="text-sm text-destructive py-12">Impossible de charger vos classes.</p>\n\n  // VUE ÉTAPE 2')
  source = source.replace('onClick={() => handleDownloadPDF(selectedClass)}', 'onClick={() => handleDownloadPDF(selectedClass)}\n            disabled={isDownloading || isLoadingSchedule || !!scheduleError}')
  source = source.replace('{isLoadingSchedule ? (', '{scheduleError ? <p className="text-sm text-destructive py-12">Impossible de charger cet emploi du temps.</p> : isLoadingSchedule ? (')
  write('apps/site/src/features/schedules/pages/TeacherSchedulesPage.tsx', source)
}

{
  let source = original('admin.enseignants')
  source = source.replace("import { useAuthStore } from '@sacre-coeur/auth/stores/auth-store'\n", '')
  const start = marker(source, '  const users = useAuthStore')
  const end = marker(source, '  // Formulaire de création')
  source = source.slice(0, start) + "  const { data: teachers = [], isLoading: isLoadingTeachers, error: teachersError } = useFetchData(['teachers'], () => teacherService.getAllTeacher())\n\n" + source.slice(end)
  source = source.replace('=> createTeacher(newTeacher)', '=> teacherService.register(newTeacher)').replaceAll("queryKey: ['teacher']", "queryKey: ['teachers']")
  source = source.replace("  const updateUserInStore = useAuthStore(s => s.updateUserInStore)\n  const removeUser = useAuthStore(s => s.removeUser)\n\n", '')
  source = source.replace('onSuccess: (_, variables) => {\n        updateUserInStore(variables.id, variables.payload)', "onSuccess: () => {\n        queryClient.invalidateQueries({ queryKey: ['teachers'] })\n        queryClient.invalidateQueries({ queryKey: ['teacherProfile'] })")
  source = source.replace('onSuccess: (_data, id) => {\n        removeUser(id)', "onSuccess: () => {\n        queryClient.invalidateQueries({ queryKey: ['teachers'] })\n        queryClient.invalidateQueries({ queryKey: ['teacherProfile'] })")
  const copyStart = marker(source, '  const handleCopyAccessId')
  const copyEnd = marker(source, '  const handleManageClasses')
  source = source.slice(0, copyStart) + `  const handleCopyAccessId = async (accessId: string) => {
    try { await navigator.clipboard.writeText(accessId); toast.success("ID d'accès copié") }
    catch (error) { SupabaseErrorHandler.handle(error) }
  }

` + source.slice(copyEnd)
  source = source.replace('fullName: name,', 'fullName: name.trim(),').replace('email: email,', 'email: email.trim(),')
  source = source.replace('      {/* Formulaire de création */}', '      {isLoadingTeachers && <p className="text-sm opacity-60 mb-4">Chargement des enseignants...</p>}\n      {teachersError && <p className="text-sm text-destructive mb-4">Impossible de charger les enseignants.</p>}\n      {/* Formulaire de création */}')
  write('apps/admin/src/features/teachers/pages/TeachersPage.tsx', source)
}

{
  let source = original('admin.index')
  source = source.replace("import { useAuthStore } from '@sacre-coeur/auth/stores/auth-store'", "import { teacherService } from '@sacre-coeur/data-access/services/teacher/teacher.service'")
  const start = marker(source, '  // Récupération des enseignants')
  const end = marker(source, '  // Helper')
  source = source.slice(0, start) + "  const { data: teachers = [], isLoading: isLoadingTeachers, error: teacherError } = useFetchData(['teachers'], () => teacherService.getAllTeacher())\n\n" + source.slice(end)
  source = source.replace("['all-students']", "['students', 'admin']").replace("['all-classes']", "['classes']").replace("['recent-announcements']", "['announcements']")
  source = source.replace("return status === 'accepte' || status === 'valide'", "return status === 'accepte'")
  source = source.replace('isLoadingStudents || isLoadingClasses || isLoadingAnnouncements', 'isLoadingStudents || isLoadingClasses || isLoadingAnnouncements || isLoadingTeachers')
  source = source.replace('studentError || classError || announcementError', 'studentError || classError || announcementError || teacherError')
  source = source.replace("label: 'Enseignants activés'", "label: 'Enseignants enregistrés'").replaceAll("navigate('/admin/validations')", "navigate('/validations')")
  write('apps/admin/src/features/dashboard/pages/AdminDashboardPage.tsx', source)
}

for (const path of ['apps/site/src/features/schedules/pages/ParentSchedulesPage.tsx', 'apps/admin/src/features/schedules/pages/SchedulesPage.tsx']) {
  let source = read(path)
  source = source.replace(/const DAYS: ScheduleEntry\['dayOfWeek'\]\[\] = \[[\s\S]*?\]\n/, "import { SCHOOL_DAYS as DAYS, filterScheduleEntries } from '@sacre-coeur/school-features/schedules/schedule-view'\n")
  write(path, source)
}

{
  const path = 'packages/school-features/src/students/components/StudentProfile.tsx'
  let source = read(path)
  source = source.replace('Non configur?e', 'Non configurée').replace('Tarif non d?fini', 'Tarif non défini')
  source = source.replace('  return (\n    <div className="space-y-4', '  if (error) return <p className="p-6 rounded-3xl bg-card border border-border text-sm text-destructive">Impossible de charger le profil financier. Veuillez réessayer.</p>\n\n  return (\n    <div className="space-y-4')
  source = source.replace("{student.currentClassName || 'Classe non assignée'}", "{className || 'Classe non assignée'}")
  source = source.replace(/onClick=\{\(\) =>\s*window\.open\([\s\S]*?'_blank'\s*\)\s*\}/, 'onClick={() => downloadReceipt(receipt.id)}')
  source = source.replace(/title="Le billet de vacances[^"]*"/, 'title="Le billet de vacances n’est pas disponible dans le projet."')
  write(path, source)
}

console.log('Feature page extraction completed with validated source markers.')
