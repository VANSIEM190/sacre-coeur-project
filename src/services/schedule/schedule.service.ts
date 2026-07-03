import type { ScheduleEntry } from '@/lib/types'
import { supabase } from '@/supabase/supabaseClient'

class HorraireServices {
  async getSchedule(classeId: string): Promise<ScheduleEntry[]> {
    const { data, error } = await supabase
      .from('schedule_entries')
      .select('*')
      .eq('classe_id', classeId)
      .order('startTime', { ascending: true })

    if (error) throw new Error(error.message)

    return (data || []).map(entry => ({
      id: entry.id,
      classe_id: entry.classe_id,
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime.slice(0, 5),
      endTime: entry.endTime.slice(0, 5),
      subject: entry.subject,
      room: entry.room,
      teacherName: entry.teacherName,
      created_at: entry.created_at,
    }))
  }

  async createScheduleEntry(
    entry: Omit<ScheduleEntry, 'id' | 'created_at'>
  ): Promise<ScheduleEntry> {
    const { data, error } = await supabase
      .from('schedule_entries')
      .insert([
        {
          classe_id: entry.classe_id,
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

    if (error) throw new Error(error.message)

    return {
      id: data.id,
      classe_id: data.classe_id,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime.slice(0, 5),
      endTime: data.endTime.slice(0, 5),
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
    const payload = {
      dayOfWeek: updates.dayOfWeek,
      startTime: updates.startTime,
      endTime: updates.endTime,
      subject: updates.subject,
      room: updates.room,
      teacherName: updates.teacherName,
    }

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
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime.slice(0, 5),
      endTime: data.endTime.slice(0, 5),
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
