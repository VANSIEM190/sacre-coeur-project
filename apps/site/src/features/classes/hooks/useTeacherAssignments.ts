import { useAuthStore } from '@sacre-coeur/auth/stores/auth-store'
import { useFetchData } from '@sacre-coeur/data-access/hooks/useQuery'
import { classService } from '@sacre-coeur/data-access/services/classe/classe.service'
import { teacherService } from '@sacre-coeur/data-access/services/teacher/teacher.service'
import { getCurrentSchoolYear } from '@sacre-coeur/domain/utils/getCurrentSchoolYear'

/** Le profil fournit les affectations ; la session fournit l'identité Auth. */
export function useTeacherAssignments() {
  const currentUser = useAuthStore(state => state.currentUser)
  const schoolYear = getCurrentSchoolYear()
  const profile = useFetchData(
    ['teacherProfile', currentUser?.id],
    () => teacherService.getDetailsByUserId(currentUser!.id),
    { enabled: currentUser?.role === 'teacher' }
  )
  const classes = useFetchData(['classes'], () => classService.getAllClasses())
  const assignedClassIds = profile.data?.assignedclasses ?? []
  const assignedClasses = (classes.data ?? []).filter(
    schoolClass =>
      assignedClassIds.includes(schoolClass.id) &&
      schoolClass.annee_scolaire === schoolYear
  )

  return {
    currentUser,
    teacher: profile.data,
    schoolYear,
    assignedClasses,
    assignedClassIds: assignedClasses.map(schoolClass => schoolClass.id),
    isLoading: profile.isLoading || classes.isLoading,
    error: profile.error ?? classes.error,
  }
}
