import type { Announcement } from '@/lib/types'
import { supabase } from '@/supabase/supabaseClient'

class AnnouncementService {
  async getAnnouncement(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)

    return (data || []).map(announcement => ({
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      targetClassNames: announcement.targetClassNames,
      author: announcement.author,
      createdAt: announcement.created_at,
      updatedAt: announcement.updated_at,
    }))
  }

  async createAnnouncement(
    announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Announcement> {
    const { data, error } = await supabase
      .from('announcements')
      .insert([
        {
          title: announcement.title,
          body: announcement.body,
          targetClassNames: announcement.targetClassNames,
          author: announcement.author,
        },
      ])
      .select()
      .single()

    if (error) throw new Error(error.message)

    return {
      id: data.id,
      title: data.title,
      body: data.body,
      targetClassNames: data.targetClassNames,
      author: data.author,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  async updateScheduleEntry(
    id: string,
    updates: Partial<Omit<Announcement, 'id' | 'createdAt' | 'updateAt'>>
  ): Promise<Announcement> {
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

export const announcementService = new AnnouncementService()
