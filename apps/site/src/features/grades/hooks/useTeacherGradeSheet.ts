import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useFetchData, useMutateData } from '@sacre-coeur/data-access/hooks/useQuery'
import { classService } from '@sacre-coeur/data-access/services/classe/classe.service'
import { horraireServices } from '@sacre-coeur/data-access/services/schedule/schedule.service'
import { gradeService, type GradeEntry } from '@sacre-coeur/data-access/services/grade/grade.service'
import { SupabaseErrorHandler } from '@sacre-coeur/school-features/feedback/supabase-error-handler'
import type { PaymentTranche } from '@sacre-coeur/domain/types'
import { useTeacherAssignments } from '../../classes/hooks/useTeacherAssignments'

export function useTeacherGradeSheet() {
  const assignments = useTeacherAssignments()
  const { currentUser, teacher, schoolYear, assignedClasses } = assignments
  const queryClient = useQueryClient()
  const [classId, setClassId] = useState('')
  const [subject, setSubject] = useState('')
  const [tranche, setTranche] = useState<PaymentTranche>(1)
  const [scores, setScores] = useState<Record<string, string>>({})
  const selectedClassId = classId || assignedClasses[0]?.id || ''
  const isAssigned = assignedClasses.some(schoolClass => schoolClass.id === selectedClassId)
  const subjectsQuery = useFetchData(
    ['teacherCourses', teacher?.id, selectedClassId, schoolYear],
    () => horraireServices.getTeacherCoursesInClass(teacher!.id, selectedClassId),
    { enabled: !!teacher?.id && isAssigned }
  )
  const subjects = (subjectsQuery.data ?? []).map(course => course.subject)
  const selectedSubject = subjects.includes(subject) ? subject : subjects[0] ?? ''
  const studentsQuery = useFetchData(
    ['students', 'class', selectedClassId, currentUser?.id, schoolYear],
    () => classService.getStudentsInClass(selectedClassId),
    { enabled: isAssigned }
  )
  const gradesQuery = useFetchData(
    ['grades', 'teacher', currentUser?.id, schoolYear],
    () => gradeService.getTeacherGrades(currentUser!.id, schoolYear),
    { enabled: !!currentUser?.id }
  )
  const grades = gradesQuery.data ?? []
  const students = studentsQuery.data ?? []
  const existingGrade = (studentId: string) => grades.find(grade =>
    grade.eleve_id === studentId && grade.classe_id === selectedClassId &&
    grade.subject === selectedSubject && grade.tranche === tranche
  )
  const scoreFor = (studentId: string) => scores[studentId] ??
    (existingGrade(studentId) ? String(existingGrade(studentId)!.score) : '')
  const maxScoreFor = (studentId: string) => existingGrade(studentId)?.max_score ?? 20
  const mutation = useMutateData((entries: GradeEntry[]) => gradeService.saveGrades(entries), {
    onSuccess: async () => {
      setScores({})
      await queryClient.invalidateQueries({ queryKey: ['grades'] })
      await queryClient.invalidateQueries({ queryKey: ['grade'] })
      toast.success('Fiche de cotation enregistrée.')
    },
    onError: error => SupabaseErrorHandler.handle(error),
  })
  const save = () => {
    if (!currentUser?.id || !isAssigned || !subjects.includes(selectedSubject)) {
      toast.error('Sélectionnez une classe et une matière qui vous sont attribuées.')
      return
    }
    if (students.length === 0) {
      toast.error('Cette classe ne contient aucun élève à noter.')
      return
    }
    if (students.some(student => scoreFor(student.id).trim() === '')) {
      toast.error('Saisissez une note pour chaque élève avant de valider la fiche.')
      return
    }
    mutation.mutate(students.map(student => ({
      eleve_id: student.id,
      classe_id: selectedClassId,
      teacher_id: currentUser.id,
      subject: selectedSubject,
      tranche,
      score: Number(scoreFor(student.id)),
      max_score: maxScoreFor(student.id),
      school_year: schoolYear,
    })))
  }

  const sheets = Array.from(grades.reduce((groups, grade) => {
    const key = JSON.stringify([grade.classe_id, grade.subject, grade.tranche])
    const group = groups.get(key) ?? {
      id: key,
      className: assignedClasses.find(schoolClass => schoolClass.id === grade.classe_id)?.nom_classe ?? 'Classe non disponible',
      subject: grade.subject,
      tranche: grade.tranche,
      entriesCount: 0,
      updatedAt: grade.updated_at || grade.created_at,
    }
    group.entriesCount += 1
    if ((grade.updated_at || grade.created_at) > group.updatedAt) group.updatedAt = grade.updated_at || grade.created_at
    groups.set(key, group)
    return groups
  }, new Map<string, { id: string; className: string; subject: string; tranche: number; entriesCount: number; updatedAt: string }>()).values())

  return {
    ...assignments, selectedClassId, selectedSubject, subjects, tranche, students,
    scores, setScores, scoreFor, maxScoreFor, sheets, mutation, save,
    changeClass: (id: string) => { setClassId(id); setSubject(''); setScores({}) },
    changeSubject: (value: string) => { setSubject(value); setScores({}) },
    changeTranche: (value: PaymentTranche) => { setTranche(value); setScores({}) },
    isLoading: assignments.isLoading || studentsQuery.isLoading || subjectsQuery.isLoading || gradesQuery.isLoading,
    error: assignments.error ?? studentsQuery.error ?? subjectsQuery.error ?? gradesQuery.error,
  }
}
