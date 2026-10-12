import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useFetchData, useMutateData } from '@sacre-coeur/data-access/hooks/useQuery'
import { studentService } from '@sacre-coeur/data-access/services/student/Student.service'
import { classService } from '@sacre-coeur/data-access/services/classe/classe.service'
import type { ClassName, EleveDetails } from '@sacre-coeur/domain/types'
import type { studentType } from '@sacre-coeur/domain/validators/usersSchema'
import { getCurrentSchoolYear } from '@sacre-coeur/domain/utils/getCurrentSchoolYear'
import { useAuthStore } from '@sacre-coeur/auth/stores/auth-store'
import { SupabaseErrorHandler } from '@sacre-coeur/school-features/feedback/supabase-error-handler'

const EMPTY_CHILDREN: EleveDetails[] = []
const EMPTY_CLASSES: ClassName[] = []
type ChildValues = Omit<EleveDetails, 'id' | 'status' | 'classe_id' | 'parent_id'>

export function useParentChildren() {
  const queryClient = useQueryClient()
  const parentId = useAuthStore(state => state.currentUser?.id)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<EleveDetails | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<EleveDetails | null>(null)
  const childrenQuery = useFetchData<EleveDetails[]>(
    ['students', 'parent-list', parentId],
    () => studentService.getStudentsByParent(),
    { enabled: !!parentId },
  )
  const classesQuery = useFetchData<ClassName[]>(['classes'], () => classService.getAllClasses())
  const createMutation = useMutateData((values: ChildValues) => studentService.createStudentWithInscription(values, getCurrentSchoolYear()), {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', 'parent-list'] })
      queryClient.invalidateQueries({ queryKey: ['inscriptions'] })
      closeModal()
    },
    onError: error => SupabaseErrorHandler.handle(error),
  })
  const updateMutation = useMutateData(({ id, values }: { id: string; values: ChildValues }) => studentService.updateStudent(id, values), {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', 'parent-list'] })
      closeModal()
    },
    onError: error => SupabaseErrorHandler.handle(error),
  })
  const deleteMutation = useMutateData((id: string) => studentService.deleteStudent(id), {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students', 'parent-list'] }),
    onError: error => SupabaseErrorHandler.handle(error),
  })

  function closeModal() {
    setEditingStudent(null)
    setIsModalOpen(false)
  }

  const submitStudent = (values: studentType, student: EleveDetails | null) => {
    if (student) updateMutation.mutate({ id: student.id, values: { ...values, currentClassName: student.currentClassName } })
    else createMutation.mutate(values)
  }

  const deleteStudent = (studentId: string) => {
    if (confirm('Voulez-vous vraiment retirer ce dossier ?')) deleteMutation.mutate(studentId)
  }

  return {
    children: childrenQuery.data ?? EMPTY_CHILDREN,
    classes: classesQuery.data ?? EMPTY_CLASSES,
    isLoading: childrenQuery.isLoading,
    isModalOpen,
    editingStudent,
    selectedStudent,
    createMutation,
    updateMutation,
    deleteMutation,
    isSaving: createMutation.isPending || updateMutation.isPending,
    setIsModalOpen,
    setEditingStudent,
    setSelectedStudent,
    closeModal,
    submitStudent,
    deleteStudent,
  }
}
