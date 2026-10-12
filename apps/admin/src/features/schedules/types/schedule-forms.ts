import type { ScheduleEntry } from '@sacre-coeur/domain/types'

export interface ScheduleCreateForm {
  classe_id: string
  teacher_id: string
  dayOfWeek: ScheduleEntry['dayOfWeek']
  startTime: string
  endTime: string
  subject: string
  room: string
  teacherName: string
}

export interface ScheduleEditForm {
  startTime: string
  endTime: string
  subject: string
  room: string
  teacher_id: string
  teacherName: string
}

export const SCHEDULE_DAYS: ScheduleEntry['dayOfWeek'][] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
