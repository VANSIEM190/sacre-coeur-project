import { useQueryClient } from '@tanstack/react-query'
import { useFetchData, useMutateData } from '@sacre-coeur/data-access/hooks/useQuery'
import { classService } from '@sacre-coeur/data-access/services/classe/classe.service'
import { horraireServices } from '@sacre-coeur/data-access/services/schedule/schedule.service'
import { teacherService } from '@sacre-coeur/data-access/services/teacher/teacher.service'
import type { ClassName, ScheduleEntry, TeacherUser } from '@sacre-coeur/domain/types'
import { SupabaseErrorHandler } from '@sacre-coeur/school-features/feedback/supabase-error-handler'

export function useAdminSchedules(selectedClass: ClassName | null, onCreate: () => void, onUpdate: () => void) {
  const queryClient = useQueryClient()
  const classesQuery = useFetchData<ClassName[]>(['classes'], () => classService.getAllClasses())
  const scheduleQuery = useFetchData<ScheduleEntry[]>(
    ['schedule', selectedClass?.id],
    () => horraireServices.getSchedule(selectedClass!.id),
    { enabled: !!selectedClass?.id },
  )
  const teachersQuery = useFetchData<TeacherUser[]>(['teachers'], () => teacherService.getAllTeacher())
  const invalidateSchedule = () => queryClient.invalidateQueries({ queryKey: ['schedule'] })

  const createMutation = useMutateData<ScheduleEntry, Error, Omit<ScheduleEntry, 'id' | 'created_at'>>(
    entry => horraireServices.createScheduleEntry(entry),
    { onSuccess: async () => { await invalidateSchedule(); onCreate() }, onError: error => SupabaseErrorHandler.handle(error) },
  )
  const updateMutation = useMutateData<ScheduleEntry, Error, {
    id: string
    payload: Partial<Omit<ScheduleEntry, 'id' | 'classe_id' | 'created_at'>>
  }>(
    ({ id, payload }) => horraireServices.updateScheduleEntry(id, payload),
    { onSuccess: async () => { await invalidateSchedule(); onUpdate() }, onError: error => SupabaseErrorHandler.handle(error) },
  )
  const deleteMutation = useMutateData<boolean, Error, string>(
    id => horraireServices.deleteScheduleEntry(id),
    { onSuccess: invalidateSchedule, onError: error => SupabaseErrorHandler.handle(error) },
  )

  return { classesQuery, scheduleQuery, teachersQuery, createMutation, updateMutation, deleteMutation }
}
