import { PageHeader } from '@/components/dashboard-shell'
import { useSchoolStore } from '@/stores/school-store'
import { useState, useMemo } from 'react'
import { Plus, Trash2, Edit3, X, Check, Search } from 'lucide-react'
import type { ArchiveDocument } from '@/lib/types'

function AdminArchives() {
  const items = useSchoolStore(s => s.archives)
  const create = useSchoolStore(s => s.createArchive)
  const remove = useSchoolStore(s => s.deleteArchive)
  const update = useSchoolStore(s => s.updateArchive)

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
  const [editForm, setEditForm] = useState({
    title: '',
    year: new Date().getFullYear(),
    category: 'Palmarès' as ArchiveDocument['category'],
    description: '',
  })

  // Logique de filtrage des archives en temps réel
  const filteredItems = useMemo(() => {
    return items.filter(a => {
      const matchesSearch =
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.year.toString().includes(searchQuery)

      const matchesCategory =
        selectedCategoryFilter === 'Tous' ||
        a.category === selectedCategoryFilter

      return matchesSearch && matchesCategory
    })
  }, [items, searchQuery, selectedCategoryFilter])

  // Initialisation du formulaire de modification
  const handleStartEdit = (archive: ArchiveDocument) => {
    setEditingId(archive.id)
    setEditForm({
      title: archive.title,
      year: archive.year,
      category: archive.category,
      description: archive.description,
    })
  }

  // Soumission de la modification
  const handleUpdateSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault()
    if (update) {
      update(id, editForm)
    }
    setEditingId(null)
  }

  return (
    <div>
      <PageHeader
        title="Archives"
        subtitle="Coffre-fort numérique des documents de l'école."
      />

      {/* Formulaire d'ajout */}
      <form
        onSubmit={e => {
          e.preventDefault()
          // Ici, tu passeras `form` et potentiellement le fichier `file` selon ton implémentation backend/store
          create(form)
          setForm({ ...form, title: '', description: '' })
          setFile(null)
        }}
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

        {/* Input de fichier stylisé et adapté */}
        <input
          type="file"
          required
          onChange={e => setFile(e.target.files?.[0] || null)}
          className="px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-muted file:text-foreground hover:file:bg-muted/80 cursor-pointer"
        />

        {/* Input description modifié en Textarea */}
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          rows={3}
          className="sm:col-span-2 px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm resize-none"
        />

        <button
          type="submit"
          className="sm:col-span-2 px-5 py-2.5 rounded-full bg-sacred-red text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus className="size-4" /> Archiver
        </button>
      </form>

      {/* Zone de Filtrage & Recherche */}
      <div className="p-5 rounded-3xl bg-card border border-border mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Barre de recherche textuelle */}
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

          {/* Filtre par catégorie */}
          <select
            value={selectedCategoryFilter}
            onChange={e => setSelectedCategoryFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm min-w-[160px]"
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

      {/* Liste des archives */}
      <div className="space-y-2">
        {filteredItems.map(a => (
          <div
            key={a.id}
            className="p-5 rounded-2xl bg-card border border-border flex flex-col gap-3"
          >
            {editingId === a.id ? (
              /* Interface dynamique de modification en ligne (Formulaire Édition) */
              <form
                onSubmit={e => handleUpdateSubmit(e, a.id)}
                className="grid sm:grid-cols-2 gap-3 w-full"
              >
                <input
                  required
                  placeholder="Titre"
                  value={editForm.title}
                  onChange={e =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  className="px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-xs"
                />
                <input
                  type="number"
                  placeholder="Année"
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
                  {['Palmarès', 'Bulletin', 'Procès-Verbal', 'Autre'].map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <textarea
                  placeholder="Description"
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
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 rounded-full border border-border text-xs font-medium flex items-center gap-1 hover:bg-muted transition-colors"
                  >
                    <X className="size-3" /> Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-full bg-sacred-red text-white text-xs font-semibold flex items-center gap-1 hover:opacity-90 transition-opacity"
                  >
                    <Check className="size-3" /> Enregistrer
                  </button>
                </div>
              </form>
            ) : (
              /* Vue normale de l'archive */
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

                {/* Actions : Édition et Suppression */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleStartEdit(a)}
                    className="size-9 rounded-full border border-border grid place-items-center hover:bg-muted text-primary transition-colors"
                    title="Modifier l'archive"
                  >
                    <Edit3 className="size-4" />
                  </button>
                  <button
                    onClick={() =>
                      confirm(
                        `Voulez-vous vraiment supprimer l'archive "${a.title}" ?`
                      ) && remove(a.id)
                    }
                    className="size-9 rounded-full border border-border grid place-items-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
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
    </div>
  )
}

export default AdminArchives
