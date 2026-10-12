import { useMemo, useState } from 'react'
import { useFetchData } from '@sacre-coeur/data-access/hooks/useQuery'
import { classService } from '@sacre-coeur/data-access/services/classe/classe.service'
import { horraireServices } from '@sacre-coeur/data-access/services/schedule/schedule.service'
import { filterElement } from '@sacre-coeur/domain/utils/filterElements'
import type { EleveDetails } from '@sacre-coeur/domain/types'
import { useTeacherAssignments } from './useTeacherAssignments'

export function useTeacherClasses() {
  const assignments = useTeacherAssignments()
  const [requestedClassId, setRequestedClassId] = useState('')
  const [studentSearchQuery, setStudentSearchQuery] = useState('')
  const selectedIdClasse = assignments.assignedClasses.some(item => item.id === requestedClassId)
    ? requestedClassId
    : assignments.assignedClasses[0]?.id ?? ''
  const selectedClass = assignments.assignedClasses.find(item => item.id === selectedIdClasse) ?? null
  const studentsQuery = useFetchData<EleveDetails[]>(
    ['students', 'class', selectedIdClasse],
    () => classService.getStudentsInClass(selectedIdClasse),
    { enabled: !!selectedIdClasse },
  )
  const subjectsQuery = useFetchData(
    ['teacherCourses', assignments.teacher?.id, selectedIdClasse, assignments.schoolYear],
    () => horraireServices.getTeacherCoursesInClass(assignments.teacher!.id, selectedIdClasse),
    { enabled: !!assignments.teacher?.id && !!selectedIdClasse },
  )
  const filteredStudents = useMemo(() => filterElement({
    items: studentsQuery.data ?? [],
    keys: ['firstName', 'middleName', 'lastName', 'phone'],
    searchQuery: studentSearchQuery,
  }), [studentsQuery.data, studentSearchQuery])

  return {
    ...assignments,
    selectedClass,
    selectedIdClasse,
    setSelectedIdClasse: setRequestedClassId,
    studentSearchQuery,
    setStudentSearchQuery,
    subjects: (subjectsQuery.data ?? []).map(course => course.subject),
    students: filteredStudents,
    isLoadingStudents: studentsQuery.isLoading,
    isLoadingSubjects: subjectsQuery.isLoading,
    error: assignments.error ?? studentsQuery.error ?? subjectsQuery.error,
  }
}
