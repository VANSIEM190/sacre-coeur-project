import { useMemo, useState } from 'react'
import type { ClassName, ScheduleEntry } from '@sacre-coeur/domain/types'
import { filterScheduleEntries } from '@sacre-coeur/school-features/schedules/schedule-view'
import { useAdminSchedules } from './useAdminSchedules'
import { SCHEDULE_DAYS } from '../types/schedule-forms'
import type { ScheduleCreateForm, ScheduleEditForm } from '../types/schedule-forms'

const initialCreateForm: ScheduleCreateForm = { classe_id: '', teacher_id: '', dayOfWeek: 'Lundi', startTime: '08:00', endTime: '09:30', subject: '', room: '', teacherName: '' }
const initialEditForm: ScheduleEditForm = { startTime: '', endTime: '', subject: '', room: '', teacher_id: '', teacherName: '' }
const EMPTY_SCHEDULE: ScheduleEntry[] = []

export function useSchedulesPage() {
  const [selectedClass, setSelectedClass] = useState<ClassName | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ScheduleEditForm>(initialEditForm)
  const [form, setForm] = useState<ScheduleCreateForm>(initialCreateForm)
  const queries = useAdminSchedules(selectedClass,
    () => setForm(previous => ({ ...previous, subject: '', room: '', teacher_id: '', teacherName: '' })),
    () => setEditingId(null))
  const classes = queries.classesQuery.data ?? []
  const schedule = queries.scheduleQuery.data ?? EMPTY_SCHEDULE
  const teachers = queries.teachersQuery.data ?? []
  const formClassId = form.classe_id || classes[0]?.id
  const teachersForForm = teachers.filter(teacher => formClassId && teacher.assignedclasses.includes(formClassId))
  const teachersForSelectedClass = teachers.filter(teacher => selectedClass && teacher.assignedclasses.includes(selectedClass.id))
  const filteredSchedule = useMemo(() => filterScheduleEntries(schedule, searchQuery), [schedule, searchQuery])

  const startEdit = (entry: ScheduleEntry) => {
    setEditingId(entry.id)
    setEditForm({ startTime: entry.startTime, endTime: entry.endTime, subject: entry.subject, room: entry.room, teacher_id: entry.teacher_id || '', teacherName: entry.teacherName || '' })
  }
  const submitUpdate = (event: React.FormEvent, id: string) => {
    event.preventDefault()
    if (!editForm.teacher_id) { alert('Veuillez sélectionner un enseignant.'); return }
    queries.updateMutation.mutate({ id, payload: editForm })
  }
  const submitCreate = (event: React.FormEvent) => {
    event.preventDefault()
    const targetClassId = form.classe_id || classes[0]?.id
    if (!targetClassId) { alert('Veuillez sélectionner ou créer une classe au préalable.'); return }
    if (!form.teacher_id) { alert('Veuillez sélectionner un enseignant.'); return }
    queries.createMutation.mutate({ ...form, classe_id: targetClassId })
  }
  const selectTeacher = (teacherId: string) => {
    const teacher = teachers.find(item => item.id === teacherId)
    setForm(previous => ({ ...previous, teacher_id: teacherId, teacherName: teacher?.fullName || '' }))
  }
  const selectEditTeacher = (teacherId: string) => {
    const teacher = teachers.find(item => item.id === teacherId)
    setEditForm(previous => ({ ...previous, teacher_id: teacherId, teacherName: teacher?.fullName || '' }))
  }
  const downloadSchedule = (targetClass: ClassName) => {
    const content = SCHEDULE_DAYS.map(day => {
      const entries = schedule.filter(entry => entry.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime))
      const lines = entries.length ? entries.map(entry => `  [${entry.startTime} - ${entry.endTime}] ${entry.subject} (Local: ${entry.room}${entry.teacherName ? ` · Prof: ${entry.teacherName}` : ''})`) : ['  Aucun cours programmé']
      return `--- ${day.toUpperCase()} ---\n${lines.join('\n')}`
    }).join('\n\n')
    const blob = new Blob([`EMPLOI DU TEMPS - CLASSE : ${targetClass.nom_classe}\n=========================================\n\n${content}\n`], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Horaire_${targetClass.nom_classe.replace(/\s+/g, '_')}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return { ...queries, classes, schedule, teachersForForm, teachersForSelectedClass, filteredSchedule, selectedClass, setSelectedClass, searchQuery, setSearchQuery, editingId, setEditingId, editForm, setEditForm, form, setForm, isLoadingClasses: queries.classesQuery.isLoading, scheduleError: queries.scheduleQuery.error, isLoadingSchedule: queries.scheduleQuery.isLoading, startEdit, submitUpdate, submitCreate, selectTeacher, selectEditTeacher, downloadSchedule }
}
