import { Loader2, Pencil, Trash2 } from 'lucide-react'
import type { Announcement } from '@sacre-coeur/domain/types'

interface AnnouncementListProps {
  announcements: Announcement[]
  isLoading: boolean
  isError: boolean
  error: unknown
  isDeleting: boolean
  onEdit: (announcement: Announcement) => void
  onDelete: (id: string) => void
}

export function AnnouncementList({ announcements, isLoading, isError, error, isDeleting, onEdit, onDelete }: AnnouncementListProps) {
  return <>
    {isLoading && <div className="flex flex-col items-center justify-center gap-2 py-12 opacity-70"><Loader2 className="size-8 animate-spin text-sacred-red" /><p className="text-sm">Chargement du coffre-fort numérique...</p></div>}
    {isError && <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive">Erreur lors du chargement des archives : {error instanceof Error ? error.message : 'Erreur inconnue'}</div>}
    <div className="space-y-3">{announcements.length === 0 && <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm opacity-60">Aucune annonce ne correspond à vos critères de recherche.</div>}
      {announcements.map(announcement => <div key={announcement.id} className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5">
        <div className="min-w-0"><p className="font-semibold">{announcement.title}</p><p className="mt-1 break-all text-sm opacity-70">{announcement.body}</p><p className="mt-2 text-xs opacity-50">{announcement.targetClassNames === 'all' ? 'Toutes classes' : announcement.targetClassNames} · Par : {announcement.author} · {new Date(announcement.createdAt).toLocaleString('fr-FR')}</p></div>
        <div className="flex shrink-0 gap-2"><button type="button" onClick={() => onEdit(announcement)} aria-label="Modifier l'annonce" className="grid size-9 place-items-center rounded-full border border-border hover:bg-muted"><Pencil className="size-4" /></button><button type="button" onClick={() => onDelete(announcement.id)} disabled={isDeleting} aria-label="Supprimer l'annonce" className="grid size-9 place-items-center rounded-full border border-border hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"><Trash2 className="size-4" /></button></div>
      </div>)}
    </div>
  </>
}
