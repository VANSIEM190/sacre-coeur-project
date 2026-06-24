import type { ScheduleEntry } from '@/lib/types'
import { supabase } from '@/supabase/supabaseClient'

class HorraireServices {
  async getSchedule(classeId: string): Promise<ScheduleEntry[]> {
    const { data, error } = await supabase
      .from('schedule_entries')
      .select('*')
      .eq('classe_id', classeId)
      .order('start_time', { ascending: true })

    if (error) throw new Error(error.message)

    return (data || []).map(entry => ({
      id: entry.id,
      classe_id: entry.classe_id,
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.start_time.slice(0, 5),
      endTime: entry.end_time.slice(0, 5),
      subject: entry.subject,
      room: entry.room,
      teacherName: entry.teacherName,
      created_at: entry.created_at,
    }))
  }

  async createScheduleEntry(
    entry: Omit<ScheduleEntry, 'id'>
  ): Promise<ScheduleEntry> {
    const { data, error } = await supabase
      .from('schedule_entries')
      .insert([
        {
          classe_id: entry.classe_id,
          day_of_week: entry.dayOfWeek,
          start_time: entry.startTime,
          end_time: entry.endTime,
          subject: entry.subject,
          room: entry.room,
          teacherName: entry.teacherName,
        },
      ])
      .select()
      .single()

    if (error) throw new Error(error.message)

    return {
      id: data.id,
      classe_id: data.classe_id,
      dayOfWeek: data.day_of_week,
      startTime: data.start_time.slice(0, 5),
      endTime: data.end_time.slice(0, 5),
      subject: data.subject,
      room: data.room,
      teacherName: data.teacher,
      created_at: data.created_at,
    }
  }

  async updateScheduleEntry(
    id: string,
    updates: Partial<Omit<ScheduleEntry, 'id' | 'classe_id' | 'created_at'>>
  ): Promise<ScheduleEntry> {
    // Reconstruction de l'objet avec le format de la base de données (snake_case)
    const payload: any = {}
    if (updates.dayOfWeek) payload.day_of_week = updates.dayOfWeek
    if (updates.startTime) payload.start_time = updates.startTime
    if (updates.endTime) payload.end_time = updates.endTime
    if (updates.subject) payload.subject = updates.subject
    if (updates.room) payload.room = updates.room
    if (updates.teacherName) payload.teacher = updates.teacherName

    const { data, error } = await supabase
      .from('schedule_entries')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error(
        'Erreur lors de la mise à jour de la période:',
        error.message
      )
      throw new Error(error.message)
    }

    return {
      id: data.id,
      classe_id: data.classe_id,
      dayOfWeek: data.day_of_week,
      startTime: data.start_time.slice(0, 5),
      endTime: data.end_time.slice(0, 5),
      subject: data.subject,
      room: data.room,
      teacherName: data.teacher,
      created_at: data.created_at,
    }
  }

  async deleteScheduleEntry(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('schedule_entries')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(
        'Erreur lors de la suppression de la période:',
        error.message
      )
      throw new Error(error.message)
    }

    return true
  }
}

export const horraireServices = new HorraireServices()
