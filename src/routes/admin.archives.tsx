import { PageHeader } from '@/components/dashboard-shell'
import { useState, useMemo } from 'react'
import {
  Plus,
  Trash2,
  Edit3,
  X,
  Check,
  Search,
  Loader2,
  Download,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { adminArchivesServices } from '@/services/AdminArchivesServices'
import type {
  ArchiveDocument,
  ArchiveDocumentInput,
  ArchiveDocumentUpdateInput,
} from '@/lib/types'
import { useFetchData, useMutateData } from '@/hooks/useQuery'
import { SupabaseErrorHandler } from '@/services/SupabaseErrorHandler'
import { filterElement } from '@/utils/filterElements'
import { supabase } from '@/supabase/supabaseClient'

function AdminArchives() {
  const queryClient = useQueryClient()

  // --- TANSTACK QUERY : GET ---
  const {
    data: items = [],
    isLoading,
    isError,
    error,
  } = useFetchData(['archives'], adminArchivesServices.getArchives)

  // --- TANSTACK QUERY : MUTATIONS ---
  const createMutation = useMutateData(
    (values: ArchiveDocumentInput) =>
      adminArchivesServices.createArchive(values),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['archives'] })
        setForm({
          title: '',
          year: new Date().getFullYear(),
          category: 'Palmarès',
          description: '',
        })
        setFile(null)
      },
      onError: err => SupabaseErrorHandler.handle(err),
    }
  )

  const updateMutation = useMutateData(
    ({ id, values }: { id: string; values: ArchiveDocumentUpdateInput }) =>
      adminArchivesServices.updateArchive(id, values),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['archives'] })
        setEditingId(null)
      },
      onError: err => SupabaseErrorHandler.handle(err),
    }
  )

  const deleteMutation = useMutateData(
    (payload: { archiveId: string; filePath: string }) =>
      adminArchivesServices.deleteArchive(payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['archives'] })
      },
      onError: err => SupabaseErrorHandler.handle(err),
    }
  )

  // États locaux du formulaire de création
  const [form, setForm] = useState({
    title: '',
    year: new Date().getFullYear(),
    category: 'Palmarès' as ArchiveDocument['category'],
    description: '',
  })
  const [file, setFile] = useState<File | null>(null)

  // États pour le filtrage
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>('Tous')

  // États pour la modification d'une archive
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ArchiveDocumentUpdateInput>({
    title: '',
    year: new Date().getFullYear(),
    category: 'Palmarès',
    description: '',
    file: null,
  })

  // Logique de filtrage en mémoire (identique et optimisée)
  const filteredItems = useMemo(() => {
    return filterElement({
      items: items,
      keys: ['title', 'description', 'year'],
      searchQuery: searchQuery,
      selectKey: 'category',
      selectedValue: selectedCategoryFilter,
    })
  }, [items, searchQuery, selectedCategoryFilter])

  const handleStartEdit = (archive: ArchiveDocument) => {
    setEditingId(archive.id)
    setEditForm({
      title: archive.title,
      year: archive.year,
      category: archive.category,
      description: archive.description,
      file: null,
    })
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return alert('Veuillez sélectionner un fichier à archiver.')

    createMutation.mutate({
      ...form,
      file: file,
    })
  }

  const handleUpdateSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault()
    updateMutation.mutate({ id, values: editForm })
  }

  // Fonctionnalité de téléchargement du document
  const handleDownloadFile = async (filePath: string, title: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('sacre-coeur-files-archives')
        .download(filePath)

      if (error) throw error

      // Création d'un lien temporaire dans le DOM pour forcer le téléchargement du fichier courant
      const url = window.URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url

      // Extraction de l'extension d'origine du fichier
      const extension = filePath.split('.').pop()
      link.setAttribute('download', `${title}.${extension}`)

      document.body.appendChild(link)
      link.click()

      // Nettoyage du DOM
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Impossible de télécharger le fichier. Veuillez réessayer.')
      console.error(err)
    }
  }

  return (
    <div>
      <PageHeader
        title="Archives"
        subtitle="Coffre-fort numérique des documents de l'école."
      />

      {/* Formulaire d'ajout */}
      <form
        onSubmit={handleCreateSubmit}
        className="p-6 rounded-3xl bg-card border border-border mb-8 grid sm:grid-cols-2 gap-3"
      >
        <div className="sm:col-span-2">
          <h2 className="font-display text-xl mb-1">Nouvelle archive</h2>
        </div>

        <input
          required
          placeholder="Titre"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className="px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm"
        />

        <input
          type="number"
          required
          placeholder="Année"
          value={form.year}
          onChange={e => setForm({ ...form, year: Number(e.target.value) })}
          className="px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm"
        />

        <select
          value={form.category}
          onChange={e =>
            setForm({
              ...form,
              category: e.target.value as ArchiveDocument['category'],
            })
          }
          className="px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm"
        >
          {['Palmarès', 'Bulletin', 'Procès-Verbal', 'Autre'].map(c => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <input
          type="file"
          required
          onChange={e => setFile(e.target.files?.[0] || null)}
          className="px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-muted file:text-foreground hover:file:bg-muted/80 cursor-pointer"
        />

        <textarea
          placeholder="Description"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          rows={3}
          className="sm:col-span-2 px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm resize-none"
        />

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="sm:col-span-2 px-5 py-2.5 rounded-full bg-sacred-red text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {createMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          {createMutation.isPending ? 'Archivage en cours...' : 'Archiver'}
        </button>
      </form>

      {/* Zone de Filtrage & Recherche */}
      <div className="p-5 rounded-3xl bg-card border border-border mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 opacity-50" />
            <input
              type="text"
              placeholder="Rechercher une archive par titre, année, description..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm"
            />
          </div>

          <select
            value={selectedCategoryFilter}
            onChange={e => setSelectedCategoryFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm min-w-40"
          >
            <option value="Tous">Toutes les catégories</option>
            {['Palmarès', 'Bulletin', 'Procès-Verbal', 'Autre'].map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des archives avec gestion des états asynchrones globaux */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 gap-2 opacity-70">
          <Loader2 className="size-8 animate-spin text-sacred-red" />
          <p className="text-sm">Chargement du coffre-fort numérique...</p>
        </div>
      )}

      {isError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
          Erreur lors du chargement des archives :{' '}
          {error instanceof Error ? error.message : 'Erreur inconnue'}
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-2">
          {filteredItems.map(a => (
            <div
              key={a.id}
              className="p-5 rounded-2xl bg-card border border-border flex flex-col gap-3"
            >
              {editingId === a.id ? (
                <form
                  onSubmit={e => handleUpdateSubmit(e, a.id)}
                  className="grid sm:grid-cols-2 gap-3 w-full"
                >
                  <input
                    required
                    value={editForm.title}
                    onChange={e =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    className="px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-xs"
                  />
                  <input
                    type="number"
                    required
                    value={editForm.year}
                    onChange={e =>
                      setEditForm({ ...editForm, year: Number(e.target.value) })
                    }
                    className="px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-xs"
                  />
                  <select
                    value={editForm.category}
                    onChange={e =>
                      setEditForm({
                        ...editForm,
                        category: e.target.value as ArchiveDocument['category'],
                      })
                    }
                    className="px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-xs"
                  >
                    {['Palmarès', 'Bulletin', 'Procès-Verbal', 'Autre'].map(
                      c => (
                        <option key={c}>{c}</option>
                      )
                    )}
                  </select>

                  {/* Optionnel : Permettre de changer le fichier lors de l'édition */}
                  <input
                    type="file"
                    onChange={e =>
                      setEditForm({
                        ...editForm,
                        file: e.target.files?.[0] || null,
                      })
                    }
                    className="px-4 py-1.5 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-xs file:mr-2 file:py-0.5 file:px-2 file:rounded-full file:border-0 file:text-[10px] file:bg-muted"
                  />

                  <textarea
                    value={editForm.description}
                    onChange={e =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    rows={2}
                    className="sm:col-span-2 px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-xs resize-none"
                  />
                  <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      disabled={updateMutation.isPending}
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 rounded-full border border-border text-xs font-medium flex items-center gap-1 hover:bg-muted transition-colors"
                    >
                      <X className="size-3" /> Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="px-3 py-1.5 rounded-full bg-sacred-red text-white text-xs font-semibold flex items-center gap-1 hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Check className="size-3" />
                      )}
                      Enregistrer
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-4 w-full">
                  <div>
                    <p className="font-semibold">{a.title}</p>
                    <p className="text-xs opacity-60">
                      <span className="font-medium text-foreground">
                        {a.category}
                      </span>{' '}
                      · {a.year}
                    </p>
                    {a.description && (
                      <p className="text-xs opacity-80 mt-1 bg-background/50 p-2 rounded-lg border border-border/40 whitespace-pre-line">
                        {a.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* BOUTON DE TÉLÉCHARGEMENT AJOUTÉ ICI */}
                    <button
                      onClick={() => handleDownloadFile(a.file, a.title)}
                      className="size-9 rounded-full border border-border grid place-items-center hover:bg-muted text-primary transition-colors"
                      title="Télécharger l'archive"
                    >
                      <Download className="size-4" />
                    </button>

                    <button
                      onClick={() => handleStartEdit(a)}
                      className="size-9 rounded-full border border-border grid place-items-center hover:bg-muted text-primary transition-colors"
                      title="Modifier l'archive"
                    >
                      <Edit3 className="size-4" />
                    </button>
                    <button
                      disabled={deleteMutation.isPending}
                      onClick={() =>
                        confirm(
                          `Voulez-vous vraiment supprimer l'archive "${a.title}" ?`
                        ) &&
                        deleteMutation.mutate({
                          archiveId: a.id,
                          filePath: a.file,
                        })
                      }
                      className="size-9 rounded-full border border-border grid place-items-center hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-40"
                      title="Supprimer l'archive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredItems.length === 0 && (
            <p className="text-sm text-center py-12 opacity-50 border border-dashed border-border rounded-2xl">
              Aucune archive ne correspond à vos critères de recherche.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminArchives
