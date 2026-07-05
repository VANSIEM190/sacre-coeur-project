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
    if (Object.keys(announcement).length === 0) {
      throw new Error('aucun donnée renseigné renseigné ')
    }

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

    if (error) {
      throw new Error('Échec de la création de la période.')
    }

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

  async updateAnnouncement(
    id: string,
    updates: Partial<Omit<Announcement, 'id' | 'createdAt' | 'updateAt'>>
  ): Promise<Announcement> {
    if (!id) throw new Error("L'identifiant de la période est requis.")

    type UpdateValueClean = NonNullable<(typeof updates)[keyof typeof updates]>
    const allowedKeys: Array<keyof typeof updates> = [
      'title',
      'body',
      'targetClassNames',
      'author',
    ]
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(
        (entry): entry is [string, UpdateValueClean] => {
          const [key, value] = entry

          const isAllowed = allowedKeys.includes(key as keyof typeof updates)

          return isAllowed && value !== undefined
        }
      )
    )

    const { data, error } = await supabase
      .from('announcements')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error(
        'Erreur lors de la mise à jour de la période:',
        error.message
      )
      throw new Error('Erreur lors de la mise à jour')
    }

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

  async deleteAnnouncement(id: string): Promise<boolean> {
    if (!id) throw new Error("L'identifiant de la période est requis.")

    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error) {
      throw new Error(error.message)
    }

    return true
  }
}

export const announcementService = new AnnouncementService()
