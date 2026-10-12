import { useQueryClient } from '@tanstack/react-query'
import { useFetchData, useMutateData } from '@sacre-coeur/data-access/hooks/useQuery'
import { studentService } from '@sacre-coeur/data-access/services/student/Student.service'
import type { EleveDetails } from '@sacre-coeur/domain/types'
import { SupabaseErrorHandler } from '@sacre-coeur/school-features/feedback/supabase-error-handler'

type EnrollmentStatus = 'accepte' | 'rejete'
interface UpdateEnrollmentInput { inscriptionId: string; status: EnrollmentStatus }

export function useEnrollmentValidation(onUpdated: () => void) {
  const queryClient = useQueryClient()
  const studentsQuery = useFetchData<EleveDetails[]>(['pending-students'], () => studentService.getAllStudents())
  const updateStatusMutation = useMutateData(
    (input: UpdateEnrollmentInput) => studentService.updateStudentStatus(input),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['pending-students'] })
        await queryClient.invalidateQueries({ queryKey: ['all-students'] })
        onUpdated()
      },
      onError: error => { SupabaseErrorHandler.handle(error); onUpdated() },
    },
  )
  return { studentsQuery, updateStatusMutation }
}
