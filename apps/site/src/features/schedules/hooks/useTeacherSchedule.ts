import { useAuthStore } from '@sacre-coeur/auth/stores/auth-store'
import { useFetchData } from '@sacre-coeur/data-access/hooks/useQuery'
import { horraireServices } from '@sacre-coeur/data-access/services/schedule/schedule.service'
import type { ScheduleEntry } from '@sacre-coeur/domain/types'
import { useTeacherAssignments } from '../../classes/hooks/useTeacherAssignments'

export function useTeacherSchedule() {
  const currentUser = useAuthStore(state => state.currentUser)
  const assignments = useTeacherAssignments()
  const scheduleQuery = useFetchData<ScheduleEntry[]>(
    ['teacherSchedule', assignments.teacher?.id],
    () => horraireServices.getTeacherSchedule(assignments.teacher!.id),
    { enabled: currentUser?.role === 'teacher' && !!assignments.teacher?.id },
  )

  return { ...assignments, scheduleQuery }
}
