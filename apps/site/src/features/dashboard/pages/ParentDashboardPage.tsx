import { PageHeader } from '@sacre-coeur/ui/layouts/dashboard-shell'
import { useAuthStore } from '@sacre-coeur/auth/stores/auth-store'
import type { Announcement } from '@sacre-coeur/domain/types'
import { Megaphone, BookOpen, Award } from 'lucide-react'
import { announcementService } from '@sacre-coeur/data-access/services/announcement/announcement.service'
import { useFetchData } from '@sacre-coeur/data-access/hooks/useQuery'
import { adminCoursesServices } from '@sacre-coeur/data-access/services/course/course.service'
import { filterByDate } from '@sacre-coeur/domain/utils/filterElements'
import { paymentService } from '@sacre-coeur/data-access/services/finance/payment.service'
import { getCurrentSchoolYear } from '@sacre-coeur/domain/utils/getCurrentSchoolYear'

function StudentHome() {
  const parent = useAuthStore(s => s.currentUser)
  const schoolYear = getCurrentSchoolYear()
  const { data: serverCourses = [] } = useFetchData(['adminCourses'], () =>
    adminCoursesServices.getCourses()
  )
  const { data: announcements = [] } = useFetchData<Announcement[]>(
    ['announcements'],
    () => announcementService.getAnnouncement()
  )

  const annoncesValides = filterByDate(announcements, 'createdAt')

  const { data: receipts = [], error: paymentsError } = useFetchData(
    ['payments', 'parent', parent?.id, schoolYear],
    () => paymentService.getParentPayments(parent!.id, schoolYear),
    { enabled: parent?.role === 'parent' }
  )

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${parent?.fullName ?? ''}`}
        subtitle={`Parent · Année ${schoolYear}`}
      />
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="p-6 rounded-3xl bg-sacred-red text-white">
          <Megaphone className="size-6 mb-3 opacity-80" />
          <p className="font-display text-4xl">{annoncesValides.length}</p>
          <p className="text-sm opacity-80">Annonces actives</p>
        </div>
        <div className="p-6 rounded-3xl bg-card border border-border">
          <BookOpen className="size-6 mb-3 text-sacred-red" />
          <p className="font-display text-4xl">{serverCourses.length}</p>
          <p className="text-sm opacity-60">Cours disponibles</p>
        </div>
        <div className="p-6 rounded-3xl bg-card border border-border">
          <Award className="size-6 mb-3 text-sacred-gold" />
          <p className="font-display text-4xl">{paymentsError ? '—' : receipts.length}</p>
          <p className="text-sm opacity-60">Reçus de paiement</p>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-card border border-border">
        <h2 className="font-display text-2xl mb-4">Dernières annonces</h2>
        <div className="space-y-3">
          {annoncesValides.slice(0, 4).map(a => (
            <div
              key={a.id}
              className="pb-3 border-b border-border last:border-0"
            >
              <p className="font-semibold text-sm">{a.title}</p>
              <p className="text-xs opacity-70">{a.body}</p>
            </div>
          ))}
          {annoncesValides.length === 0 && (
            <p className="text-sm opacity-60">Aucune annonce.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentHome
