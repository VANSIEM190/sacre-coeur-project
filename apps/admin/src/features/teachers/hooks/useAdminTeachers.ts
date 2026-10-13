import { useQueryClient } from '@tanstack/react-query'
import { useFetchData, useMutateData } from '@sacre-coeur/data-access/hooks/useQuery'
import { classService } from '@sacre-coeur/data-access/services/classe/classe.service'
import { teacherService, type RegisterTeacherInput } from '@sacre-coeur/data-access/services/teacher/teacher.service'
import type { TeacherUser } from '@sacre-coeur/domain/types'
import { toast } from 'sonner'

export const TEACHERS_QUERY_KEY = ['teachers']
export const CLASSES_QUERY_KEY = ['classes']

export function useAdminTeachers() {
  const queryClient = useQueryClient()
  const teachersQuery = useFetchData<TeacherUser[]>(TEACHERS_QUERY_KEY, () => teacherService.getAllTeacher())
  const classesQuery = useFetchData(CLASSES_QUERY_KEY, () => classService.getAllClasses())

  const refreshTeachers = () => queryClient.invalidateQueries({ queryKey: TEACHERS_QUERY_KEY })
  const createTeacher = useMutateData((input: RegisterTeacherInput) => teacherService.register(input), {
    onSuccess: async () => {
      await refreshTeachers()
      toast.success('La fiche professeur et son matricule d’activation ont été créés.')
    },
    onError: error => toast.error(error.message),
  })
  const updateTeacher = useMutateData(({ id, assignedclasses }: { id: string; assignedclasses: string[] }) =>
    teacherService.updateTeacher(id, { assignedclasses }), {
    onSuccess: async () => {
      await refreshTeachers()
      toast.success('Les classes attribuées ont été mises à jour.')
    },
    onError: error => toast.error(error.message),
  })
  const deleteTeacher = useMutateData((id: string) => teacherService.deleteTeacher(id), {
    onSuccess: async () => {
      await refreshTeachers()
      toast.success('Le professeur a été supprimé.')
    },
    onError: error => toast.error(error.message),
  })

  return { teachersQuery, classesQuery, createTeacher, updateTeacher, deleteTeacher }
}
