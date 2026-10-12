import { useMemo, useState } from 'react'
import { filterElement } from '@sacre-coeur/domain/utils/filterElements'
import { supabase } from '@sacre-coeur/data-access/supabase/supabaseClient'
import type { ArchiveDocument } from '@sacre-coeur/domain/types'
import { useAdminArchives } from './useAdminArchives'
import type { ArchiveCreateForm, ArchiveEditForm } from '../types/archive-form'

const createEmptyForm = (): ArchiveCreateForm => ({ title: '', year: new Date().getFullYear(), category: 'Palmarès', description: '' })
const createEmptyEditForm = (): ArchiveEditForm => ({ title: '', year: new Date().getFullYear(), category: 'Palmarès', description: '', file: null })
const EMPTY_ARCHIVES: ArchiveDocument[] = []

export function useArchivesPage() {
  const [form, setForm] = useState<ArchiveCreateForm>(createEmptyForm)
  const [file, setFile] = useState<File | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tous')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ArchiveEditForm>(createEmptyEditForm)
  const queries = useAdminArchives()
  const items = queries.archivesQuery.data ?? EMPTY_ARCHIVES
  const filteredItems = useMemo(() => filterElement({ items, keys: ['title', 'description', 'year'], searchQuery, selectKey: 'category', selectedValue: selectedCategory }), [items, searchQuery, selectedCategory])

  const startEdit = (archive: ArchiveDocument) => {
    setEditingId(archive.id)
    setEditForm({ title: archive.title, year: archive.year, category: archive.category, description: archive.description, file: null })
  }
  const submitCreate = (event: React.FormEvent) => {
    event.preventDefault()
    if (!file) return alert('Veuillez sélectionner un fichier à archiver.')
    queries.createMutation.mutate({ ...form, file }, { onSuccess: () => { setForm(createEmptyForm()); setFile(null) } })
  }
  const submitUpdate = (event: React.FormEvent, id: string) => {
    event.preventDefault()
    queries.updateMutation.mutate({ id, values: editForm }, { onSuccess: () => setEditingId(null) })
  }
  const download = async (filePath: string, title: string) => {
    try {
      const { data, error } = await supabase.storage.from('sacre-coeur-files-archives').download(filePath)
      if (error) throw error
      const url = window.URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${title}.${filePath.split('.').pop()}`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      alert('Impossible de télécharger le fichier. Veuillez réessayer.')
      console.error(error)
    }
  }

  return {
    ...queries, items, filteredItems, form, file, searchQuery, selectedCategory, editingId, editForm,
    isLoading: queries.archivesQuery.isLoading, isError: queries.archivesQuery.isError, error: queries.archivesQuery.error,
    setForm, setFile, setSearchQuery, setSelectedCategory, setEditingId, setEditForm,
    startEdit, submitCreate, submitUpdate, download,
  }
}
