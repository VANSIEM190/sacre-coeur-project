import { PageHeader } from '@/components/dashboard-shell'
import { useAuthStore } from '@/stores/auth-store'
import { useSchoolStore } from '@/stores/school-store'
import type { StudentUser, PaymentTranche } from '@/lib/types'
import { Download, Lock } from 'lucide-react'

function StudentPoints() {
  const student = useAuthStore(s => s.currentUser) as StudentUser
  const sheets = useSchoolStore(s => s.gradingSheets)
  const receipts = useSchoolStore(s => s.receipts).filter(
    r => r.studentId === student?.id
  )
  const paidTranches = new Set(receipts.map(r => r.tranche))

  const tranches: PaymentTranche[] = [1, 2, 3]

  return (
    <div>
      <PageHeader
        title="Points & Bulletins"
        subtitle="Vos résultats par trimestre. Disponibles après paiement de la tranche."
      />
      <div className="grid md:grid-cols-3 gap-4">
        {tranches.map(t => {
          const paid = paidTranches.has(t)
          const mySheets = sheets.filter(
            s =>
              s.tranche === t &&
              s.entries.some(e => e.studentId === student?.id)
          )
          const entries = mySheets.map(s => {
            const my = s.entries.find(e => e.studentId === student?.id)!
            return { subject: s.subject, score: my.score, max: my.maxScore }
          })
          const total = entries.reduce((acc, e) => acc + e.score, 0)
          const max = entries.reduce((acc, e) => acc + e.max, 0)
          const pct = max ? ((total / max) * 100).toFixed(1) : '—'

          return (
            <div
              key={t}
              className="p-6 rounded-3xl bg-card border border-border"
            >
              <p className="text-xs uppercase tracking-widest opacity-60 mb-2">
                Trimestre {t}
              </p>
              {paid ? (
                <>
                  <p className="font-display text-5xl mb-3">{pct}%</p>
                  <div className="space-y-1 text-xs opacity-70 mb-4">
                    {entries.map(e => (
                      <div key={e.subject} className="flex justify-between">
                        <span>{e.subject}</span>
                        <span>
                          {e.score}/{e.max}
                        </span>
                      </div>
                    ))}
                    {entries.length === 0 && <p>En attente de publication.</p>}
                  </div>
                  <button
                    onClick={() => {
                      const blob = new Blob(
                        [`Bulletin Tranche ${t} - ${pct}%`],
                        { type: 'application/pdf' }
                      )
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `bulletin_T${t}.pdf`
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="w-full py-2 rounded-full bg-sacred-red text-white text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <Download className="size-4" /> Bulletin PDF
                  </button>
                </>
              ) : (
                <div className="text-center py-6 opacity-60">
                  <Lock className="size-8 mx-auto mb-2" />
                  <p className="text-sm">Tranche non soldée</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default StudentPoints
