import { useState } from 'react'
import { useAuthStore } from '@sacre-coeur/auth/stores/auth-store'
import { filterElement } from '@sacre-coeur/domain/utils/filterElements'
import type { Announcement } from '@sacre-coeur/domain/types'
import { useAdminAnnouncements } from './useAdminAnnouncements'
import type { AnnouncementTarget } from '../types/announcement-form'

export function useAnnouncementsPage() {
  const admin = useAuthStore(state => state.currentUser)
  const [editing, setEditing] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [target, setTarget] = useState<AnnouncementTarget>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClass, setFilterClass] = useState<'all' | string>('all')
  const queries = useAdminAnnouncements()

  const reset = () => {
    setEditing(null)
    setTitle('')
    setBody('')
    setTarget('all')
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!admin) {
      alert('Action non autorisée.')
      return
    }
    if (!title.trim() || !body.trim()) return

    const payload = {
      title: title.trim(),
      body: body.trim(),
      author: "Administration de l'école",
      targetClassNames: target,
    }
    if (editing) queries.updateMutation.mutate({ id: editing, payload }, { onSuccess: reset })
    else queries.createMutation.mutate(payload, { onSuccess: reset })
  }

  const startEdit = (announcement: Announcement) => {
    setEditing(announcement.id)
    setTitle(announcement.title)
    setBody(announcement.body)
    setTarget(announcement.targetClassNames === 'all' ? 'all' : announcement.targetClassNames)
  }

  const remove = (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cette annonce ?')) queries.deleteMutation.mutate(id)
  }

  const filteredAnnouncements = filterElement<Announcement>({
    items: queries.announcementsQuery.data ?? [],
    keys: ['title', 'body'],
    searchQuery,
    selectKey: 'targetClassNames',
    selectedValue: filterClass === 'all' ? 'Tous' : filterClass,
  })

  return {
    admin,
    classes: queries.classesQuery.data ?? [],
    announcementsQuery: queries.announcementsQuery,
    createMutation: queries.createMutation,
    updateMutation: queries.updateMutation,
    deleteMutation: queries.deleteMutation,
    editing,
    title,
    body,
    target,
    searchQuery,
    filterClass,
    filteredAnnouncements,
    setTitle,
    setBody,
    setTarget,
    setSearchQuery,
    setFilterClass,
    reset,
    submit,
    startEdit,
    remove,
  }
}
