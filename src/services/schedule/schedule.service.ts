import type { ScheduleEntry } from '@/lib/types'
import { supabase } from '@/supabase/supabaseClient'

class HorraireServices {
  async getSchedule(classeId: string): Promise<ScheduleEntry[]> {
    if (!classeId) throw new Error("L'identifiant de la classe est requis.")

    const { data, error } = await supabase
      .from('schedule_entries')
      .select('*')
      .eq('classe_id', classeId)
      .order('startTime', { ascending: true })

    if (error) {
      console.error('[Erreur Sécurisée] getSchedule:', error.message)
      throw new Error("Impossible de récupérer l'emploi du temps.")
    }

    return (data || []).map(entry => ({
      id: entry.id,
      classe_id: entry.classe_id,
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime ? entry.startTime.slice(0, 5) : '',
      endTime: entry.endTime ? entry.endTime.slice(0, 5) : '',
      subject: entry.subject,
      room: entry.room,
      teacherName: entry.teacherName,
      created_at: entry.created_at,
    }))
  }

  async createScheduleEntry(
    entry: Omit<ScheduleEntry, 'id' | 'created_at'>
  ): Promise<ScheduleEntry> {
    if (Object.keys(entry).length === 0) {
      throw new Error('pas de champ renseigné ')
    }

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

    if (error) {
      console.error('[Erreur Sécurisée] createScheduleEntry:', error.message)
      throw new Error('Échec de la création de la période.')
    }

    return {
      id: data.id,
      classe_id: data.classe_id,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime ? data.startTime.slice(0, 5) : '',
      endTime: data.endTime ? data.endTime.slice(0, 5) : '',
      subject: data.subject,
      room: data.room,
      teacherName: data.teacherName,
      created_at: data.created_at,
    }
  }

  async updateScheduleEntry(
    id: string,
    updates: Partial<Omit<ScheduleEntry, 'id' | 'classe_id' | 'created_at'>>
  ): Promise<ScheduleEntry> {
    if (!id) throw new Error("L'identifiant de la période est requis.")

    type UpdatePayload = Partial<
      Pick<
        ScheduleEntry,
        | 'dayOfWeek'
        | 'startTime'
        | 'endTime'
        | 'subject'
        | 'room'
        | 'teacherName'
      >
    >

    const payload: UpdatePayload = {}

    if (updates.dayOfWeek !== undefined) payload.dayOfWeek = updates.dayOfWeek
    if (updates.startTime !== undefined) payload.startTime = updates.startTime
    if (updates.endTime !== undefined) payload.endTime = updates.endTime
    if (updates.subject !== undefined) payload.subject = updates.subject
    if (updates.room !== undefined) payload.room = updates.room
    if (updates.teacherName !== undefined)
      payload.teacherName = updates.teacherName

    const { data, error } = await supabase
      .from('schedule_entries')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Erreur Sécurisée] updateScheduleEntry:', error.message)
      throw new Error('Échec de la mise à jour de la période.')
    }

    return {
      id: data.id,
      classe_id: data.classe_id,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime ? data.startTime.slice(0, 5) : '',
      endTime: data.endTime ? data.endTime.slice(0, 5) : '',
      subject: data.subject,
      room: data.room,
      teacherName: data.teacherName,
      created_at: data.created_at,
    }
  }

  async deleteScheduleEntry(id: string): Promise<boolean> {
    if (!id) throw new Error("L'identifiant de la période est requis.")

    const { error } = await supabase
      .from('schedule_entries')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[Erreur Sécurisée] deleteScheduleEntry:', error.message)
      throw new Error('Échec de la suppression de la période.')
    }

    return true
  }
}

export const horraireServices = new HorraireServices()
