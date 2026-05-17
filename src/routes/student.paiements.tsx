import { PageHeader } from '@/components/dashboard-shell'
import { useAuthStore } from '@/stores/auth-store'
import { useSchoolStore } from '@/stores/school-store'
import type { StudentUser } from '@/lib/types'
import { Receipt } from 'lucide-react'

function StudentPaiements() {
  const student = useAuthStore(s => s.currentUser) as StudentUser
  const receipts = useSchoolStore(s => s.receipts).filter(
    r => r.studentId === student?.id
  )
  return (
    <div>
      <PageHeader
        title="Mes reçus"
        subtitle="Reçus générés après chaque paiement à la caisse."
      />
      <div className="space-y-3">
        {receipts.map(r => (
          <div
            key={r.id}
            className="p-5 rounded-2xl bg-card border border-border flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-sacred-gold/20 text-sacred-gold grid place-items-center">
                <Receipt className="size-5" />
              </div>
              <div>
                <p className="font-semibold">{r.receiptNumber}</p>
                <p className="text-xs opacity-60">
                  Tranche {r.tranche} ·{' '}
                  {new Date(r.paidAt).toLocaleDateString('fr-FR')} · Caissier{' '}
                  {r.cashierName}
                </p>
              </div>
            </div>
            <p className="font-display text-2xl">
              {r.amount} {r.currency}
            </p>
          </div>
        ))}
        {receipts.length === 0 && (
          <p className="text-sm opacity-60 text-center py-12">
            Aucun paiement enregistré. Rendez-vous à la caisse.
          </p>
        )}
      </div>
    </div>
  )
}

export default StudentPaiements
