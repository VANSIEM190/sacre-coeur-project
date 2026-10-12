import { useFetchData } from '@sacre-coeur/data-access/hooks/useQuery'
import { studentService } from '@sacre-coeur/data-access/services/student/Student.service'
import { classService } from '@sacre-coeur/data-access/services/classe/classe.service'
import { announcementService } from '@sacre-coeur/data-access/services/announcement/announcement.service'
import { teacherService } from '@sacre-coeur/data-access/services/teacher/teacher.service'
import type { Announcement, ClassName, EleveDetails, TeacherUser } from '@sacre-coeur/domain/types'

export function useAdminDashboardData() {
  const studentsQuery = useFetchData<EleveDetails[]>(['students', 'admin'], () => studentService.getAllStudents())
  const classesQuery = useFetchData<ClassName[]>(['classes'], () => classService.getAllClasses())
  const announcementsQuery = useFetchData<Announcement[]>(['announcements'], () => announcementService.getAnnouncement())
  const teachersQuery = useFetchData<TeacherUser[]>(['teachers'], () => teacherService.getAllTeacher())
  return { studentsQuery, classesQuery, announcementsQuery, teachersQuery }
}
