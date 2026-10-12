import { useFetchData } from '@sacre-coeur/data-access/hooks/useQuery'
import { classService } from '@sacre-coeur/data-access/services/classe/classe.service'
import { adminCoursesServices } from '@sacre-coeur/data-access/services/course/course.service'
import type { ClassName, Course } from '@sacre-coeur/domain/types'

export function useAdminCoursesData() {
  const coursesQuery = useFetchData<Course[]>(['adminCourses'], () => adminCoursesServices.getCourses())
  const classesQuery = useFetchData<ClassName[]>(['classes'], () => classService.getAllClasses())
  return { coursesQuery, classesQuery }
}
