
import type { Announcement } from '@sacre-coeur/domain/types'
import { requireText, requireUuid } from '@sacre-coeur/domain/validation'
import { DomainError } from '@sacre-coeur/domain/errors'
import { supabase } from '../../supabase/supabaseClient'

type AnnouncementInput = Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>
interface AnnouncementRow extends AnnouncementInput { id: string; created_at: string; updated_at: string }

function mapAnnouncement(row: AnnouncementRow): Announcement {
  return { id: row.id, title: row.title, body: row.body, author: row.author, targetClassNames: row.targetClassNames,
    createdAt: row.created_at, updatedAt: row.updated_at }
}

class AnnouncementService {
  async getAnnouncement(): Promise<Announcement[]> {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 21)
    const { data, error } = await supabase.from('announcements').select('*')
      .gte('created_at', cutoff.toISOString()).order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(mapAnnouncement)
  }

  async createAnnouncement(values: AnnouncementInput): Promise<Announcement> {
    const payload: AnnouncementInput = {
      title: requireText(values.title, 'Titre'), body: requireText(values.body, 'Message'),
      author: requireText(values.author, 'Auteur'), targetClassNames: values.targetClassNames.trim(),
    }
    const { data, error } = await supabase.from('announcements').insert(payload).select().single()
    if (error) throw error
    return mapAnnouncement(data)
  }

  async updateAnnouncement(id: string, updates: Partial<AnnouncementInput>): Promise<Announcement> {
    requireUuid(id, "Identifiant de l'annonce")
    const payload: Partial<AnnouncementInput> = {}
    for (const key of ['title', 'body', 'author'] as const) {
      if (updates[key] !== undefined) payload[key] = requireText(updates[key], key)
    }
    if (updates.targetClassNames !== undefined) payload.targetClassNames = updates.targetClassNames.trim()
    if (!Object.keys(payload).length) throw new DomainError('Aucune modification à appliquer.')
    const { data, error } = await supabase.from('announcements').update(payload).eq('id', id).select().single()
    if (error) throw error
    return mapAnnouncement(data)
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    requireUuid(id, "Identifiant de l'annonce")
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error) throw error
    return true
  }
}

export const announcementService = new AnnouncementService()
