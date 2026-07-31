import type { ScheduleEntry } from '@/lib/types'
import { supabase } from '@/supabase/supabaseClient'

type UpdatePayload = Partial<
  Pick<
    ScheduleEntry,
    | 'dayOfWeek'
    | 'startTime'
    | 'endTime'
    | 'subject'
    | 'room'
    | 'teacherName'
    | 'teacher_id'
  >
>

interface TeacherCourse {
  id: string
  subject: string
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

class HorraireServices {
  private isValidUuid(id: string): boolean {
    return UUID_REGEX.test(id)
  }

  private mapEntry(data: ScheduleEntry): ScheduleEntry {
    return {
      id: data.id,
      classe_id: data.classe_id,
      teacher_id: data.teacher_id,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime ? data.startTime.slice(0, 5) : '',
      endTime: data.endTime ? data.endTime.slice(0, 5) : '',
      subject: data.subject,
      room: data.room,
      teacherName: data.teacherName,
      created_at: data.created_at,
    }
  }

  /**
   * Sécurité : validation défensive de l'UUID côté client (échoue tôt,
   * message clair). La vraie barrière reste la RLS SELECT sur
   * `schedule_entries`.
   */
  async getSchedule(classeId: string): Promise<ScheduleEntry[]> {
    if (!classeId || !this.isValidUuid(classeId)) {
      throw new Error("L'identifiant de la classe est requis et invalide.")
    }

    const { data, error } = await supabase
      .from('schedule_entries')
      .select('*')
      .eq('classe_id', classeId)
      .order('dayOfWeek', { ascending: true })
      .order('startTime', { ascending: true })

    if (error) {
      console.error('[HorraireServices.getSchedule]:', error.message)
      throw new Error("Impossible de récupérer l'emploi du temps.")
    }

    return (data || []).map(entry => this.mapEntry(entry))
  }

  /**
   * Sécurité : `teacherId` et `classId` validés en UUID. Filtre sur la
   * vraie clé étrangère `teacher_id` — fiable, contrairement à un
   * matching par nom. La RLS SELECT sur `schedule_entries` reste la
   * barrière d'autorisation réelle.
   */
  getTeacherCoursesInClass = async (
    teacherId: string,
    classId: string
  ): Promise<TeacherCourse[]> => {
    if (
      !teacherId ||
      !classId ||
      !this.isValidUuid(teacherId) ||
      !this.isValidUuid(classId)
    ) {
      return []
    }

    const { data, error } = await supabase
      .from('schedule_entries')
      .select('id, subject')
      .eq('classe_id', classId)
      .eq('teacher_id', teacherId)

    if (error) {
      console.error(
        '[HorraireServices.getTeacherCoursesInClass]:',
        error.message
      )
      throw new Error('Erreur lors de la récupération de vos cours.')
    }
    if (!data) return []

    const seen = new Set<string>()
    const courses: TeacherCourse[] = []
    for (const row of data) {
      if (row.subject && !seen.has(row.subject)) {
        seen.add(row.subject)
        courses.push({ id: row.id, subject: row.subject })
      }
    }
    return courses
  }

  /**
   * Sécurité : `classe_id` et `teacher_id` validés en UUID (garde
   * défensive — Zod s'en charge en amont côté formulaire pour le reste).
   * Vérifie les chevauchements horaires : règle métier qui ne peut pas
   * être portée par Zod puisqu'elle dépend des données déjà en base.
   * L'autorisation admin reste imposée par la RLS INSERT.
   */
  async createScheduleEntry(
    entry: Omit<ScheduleEntry, 'id' | 'created_at'>
  ): Promise<ScheduleEntry> {
    if (!entry.classe_id || !this.isValidUuid(entry.classe_id)) {
      throw new Error("L'identifiant de la classe est requis et invalide.")
    }
    if (!entry.teacher_id || !this.isValidUuid(entry.teacher_id)) {
      throw new Error("L'enseignant sélectionné est requis et invalide.")
    }

    const { data: overlaps, error: overlapError } = await supabase
      .from('schedule_entries')
      .select('id, startTime, endTime')
      .eq('classe_id', entry.classe_id)
      .eq('dayOfWeek', entry.dayOfWeek)

    if (overlapError) {
      console.error(
        '[HorraireServices.createScheduleEntry] overlap check:',
        overlapError.message
      )
      throw new Error('Erreur lors de la vérification des conflits horaires.')
    }

    const hasConflict = (overlaps || []).some(
      e => entry.startTime < e.endTime && entry.endTime > e.startTime
    )
    if (hasConflict) {
      throw new Error(
        'Un créneau existe déjà sur cette plage horaire pour cette classe.'
      )
    }

    const { data, error } = await supabase
      .from('schedule_entries')
      .insert([
        {
          classe_id: entry.classe_id,
          teacher_id: entry.teacher_id,
          dayOfWeek: entry.dayOfWeek,
          startTime: entry.startTime,
          endTime: entry.endTime,
          subject: entry.subject,
          room: entry.room,
          teacherName: entry.teacherName,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('[HorraireServices.createScheduleEntry]:', error.message)
      throw new Error('Échec de la création de la période.')
    }

    return this.mapEntry(data)
  }

  /**
   * Sécurité : `id` validé en UUID ; `teacher_id`, s'il est fourni, est
   * aussi validé. Autorisation admin imposée par la RLS UPDATE.
   */
  async updateScheduleEntry(
    id: string,
    updates: Partial<Omit<ScheduleEntry, 'id' | 'classe_id' | 'created_at'>>
  ): Promise<ScheduleEntry> {
    if (!id || !this.isValidUuid(id)) {
      throw new Error("L'identifiant de la période est requis et invalide.")
    }
    if (
      updates.teacher_id !== undefined &&
      updates.teacher_id !== null &&
      !this.isValidUuid(updates.teacher_id)
    ) {
      throw new Error("L'enseignant sélectionné est invalide.")
    }

    const payload: UpdatePayload = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    )

    if (Object.keys(payload).length === 0) {
      throw new Error('Aucune donnée à mettre à jour.')
    }

    const { data, error } = await supabase
      .from('schedule_entries')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[HorraireServices.updateScheduleEntry]:', error.message)
      throw new Error('Échec de la mise à jour de la période.')
    }

    return this.mapEntry(data)
  }

  /**
   * Sécurité CRITIQUE : opération admin uniquement — imposée par la RLS
   * DELETE sur `schedule_entries`.
   */
  async deleteScheduleEntry(id: string): Promise<boolean> {
    if (!id || !this.isValidUuid(id)) {
      throw new Error("L'identifiant de la période est requis et invalide.")
    }

    const { error } = await supabase
      .from('schedule_entries')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[HorraireServices.deleteScheduleEntry]:', error.message)
      throw new Error('Échec de la suppression de la période.')
    }

    return true
  }
}

export const horraireServices = new HorraireServices()
