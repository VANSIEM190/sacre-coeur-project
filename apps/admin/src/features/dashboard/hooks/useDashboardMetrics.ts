import { useMemo } from 'react'
import { useAdminDashboardData } from './useAdminDashboardData'
import type { Announcement, ClassName, EleveDetails, TeacherUser } from '@sacre-coeur/domain/types'

const EMPTY_STUDENTS: EleveDetails[] = []
const EMPTY_CLASSES: ClassName[] = []
const EMPTY_ANNOUNCEMENTS: Announcement[] = []
const EMPTY_TEACHERS: TeacherUser[] = []

const getInscription = (student: EleveDetails) => student.inscriptions?.[0]

export function useDashboardMetrics() {
  const queries = useAdminDashboardData()
  const students = queries.studentsQuery.data ?? EMPTY_STUDENTS
  const classes = queries.classesQuery.data ?? EMPTY_CLASSES
  const announcements = queries.announcementsQuery.data ?? EMPTY_ANNOUNCEMENTS
  const teachers = queries.teachersQuery.data ?? EMPTY_TEACHERS

  const validatedStudents = useMemo(() => students.filter(student => (getInscription(student)?.status || student.status) === 'accepte'), [students])
  const pendingStudents = useMemo(() => students.filter(student => (getInscription(student)?.status || student.status) === 'en_attente'), [students])
  const classDistribution = useMemo(() => classes.map(classe => ({
    name: classe.nom_classe,
    'Élèves actifs': validatedStudents.filter(student => (getInscription(student)?.classe_id || student.classe_id) === classe.id).length,
  })), [classes, validatedStudents])
  const statusDistribution = useMemo(() => [
    { name: 'Élèves Validés', value: validatedStudents.length, color: '#991b1b' },
    { name: 'En Attente', value: pendingStudents.length, color: '#f59e0b' },
    { name: 'Enseignants', value: teachers.length, color: '#3b82f6' },
  ], [validatedStudents, pendingStudents, teachers])

  return {
    queries, students, classes, announcements, teachers, validatedStudents,
    pendingStudents, classDistribution, statusDistribution,
    isLoading: queries.studentsQuery.isLoading || queries.classesQuery.isLoading || queries.announcementsQuery.isLoading || queries.teachersQuery.isLoading,
    hasError: !!(queries.studentsQuery.error || queries.classesQuery.error || queries.announcementsQuery.error || queries.teachersQuery.error),
  }
}
