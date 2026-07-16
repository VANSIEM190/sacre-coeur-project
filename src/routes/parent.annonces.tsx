import { PageHeader } from '@/components/Dashboard-shell'
import type { Announcement } from '@/lib/types'
import { announcementService } from '@/services/announcement/announcement.service'
import { useFetchData } from '@/hooks/useQuery'
import { Loader2 } from 'lucide-react'

function ParentAnnonces() {
  const {
    data: announcements = [],
    isLoading,
    isError,
    error,
  } = useFetchData<Announcement[]>(['announcements'], () =>
    announcementService.getAnnouncement()
  )

  // Seuil de 3 semaines pour la double sécurité locale
  const threeWeeksAgo = new Date()
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21)

  // Seuil pour le badge "New" (ex: moins de 3 jours)
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  const items = announcements.filter(a => {
    const createdDate = new Date(a.updatedAt)

    // 1. Double barrière de sécurité : Éliminer si plus vieux que 3 semaines
    if (createdDate < threeWeeksAgo) return false

    // 2. Filtrage par classe
    return true
  })
  console.log(items)

  return (
    <div>
      <PageHeader title="Annonces" />
      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-sm opacity-50 text-center py-4">
            Aucune annonce disponible.
          </p>
        )}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 opacity-70">
            <Loader2 className="size-8 animate-spin text-sacred-red" />
            <p className="text-sm">Chargement des annonces numériques...</p>
          </div>
        )}
        {isError && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
            Erreur lors du chargement des annonces :{' '}
            {error instanceof Error ? error.message : 'Erreur inconnue'}
          </div>
        )}
        {items.map(a => {
          const isNew = new Date(a.createdAt) > threeDaysAgo

          return (
            <div
              key={a.id}
              className="p-5 rounded-2xl bg-card border border-border relative overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="font-semibold">{a.title}</p>

                {/* Badge NEW natif en Tailwind CSS sans package externe */}
                {isNew && (
                  <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-primary text-primary-foreground rounded-full animate-pulse">
                    New
                  </span>
                )}
              </div>

              <p className="text-sm opacity-70 whitespace-pre-wrap">{a.body}</p>

              <p className="text-xs opacity-50 mt-2">
                {new Date(a.createdAt).toLocaleString('fr-FR')}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ParentAnnonces
