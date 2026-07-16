import { useMemo } from 'react'
import { PageHeader } from '@/components/Dashboard-shell'
import { useFetchData } from '@/hooks/useQuery'
import { paymentService } from '@/services/finance/payment.service'
import type { StudentUser, PaymentReceipt } from '@/lib/types'
import {
  User,
  Receipt,
  Calendar,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import { getCurrentSchoolYear } from '@/utils/getCurrentSchoolYear'

// Définition des Props du composant
interface StudentProfileFinanceProps {
  student: StudentUser
}

// Helper pour formater le nom complet
const getStudentFullName = (s: Partial<StudentUser>) => {
  return [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ')
}

export default function StudentProfile({
  student,
}: StudentProfileFinanceProps) {
  const currentSchoolYear = getCurrentSchoolYear()
  console.log(student.id)
  // 1. Récupération de TOUS les reçus de cet élève
  const { data: receipts = [], isLoading } = useFetchData<PaymentReceipt[]>(
    ['payments', student.id],
    () => paymentService.getStudentPayment() // Idéalement filtré par étudiant côté API, sinon on filtre en local ci-dessous
  )

  // 2. Filtrer les reçus pour cet élève précis et l'année en cours
  const studentReceipts = useMemo(() => {
    return receipts.filter(
      r => r.studentId === student.id && r.schoolYear === currentSchoolYear
    )
  }, [receipts, student.id, currentSchoolYear])
  console.log(receipts)
  // 3. Calcul du total payé par Devise (USD et FC)
  const totals = useMemo(() => {
    return studentReceipts.reduce(
      (acc, r) => {
        const currency = r.currency || 'USD'
        acc[currency] = (acc[currency] || 0) + r.amount
        return acc
      },
      { USD: 0, FC: 0 } as Record<'USD' | 'FC', number>
    )
  }, [studentReceipts])

  // 4. Analyse de l'état des tranches (Tranche 1, 2, 3)
  // Permet de savoir quelle tranche est entièrement réglée, entamée ou vierge
  const trancheStatus = useMemo(() => {
    const status = {
      1: { totalUSD: 0, totalFC: 0, count: 0 },
      2: { totalUSD: 0, totalFC: 0, count: 0 },
      3: { totalUSD: 0, totalFC: 0, count: 0 },
    }

    studentReceipts.forEach(r => {
      const t = r.tranche as 1 | 2 | 3
      if (status[t]) {
        status[t].count += 1
        if (r.currency === 'FC') {
          status[t].totalFC += r.amount
        } else {
          status[t].totalUSD += r.amount
        }
      }
    })

    return status
  }, [studentReceipts])

  // Helper pour styliser les badges d'état des tranches
  const getTrancheBadge = (trancheNum: 1 | 2 | 3) => {
    const info = trancheStatus[trancheNum]
    if (info.count === 0) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full font-medium">
          <Clock className="size-3.5" /> Non entamée
        </div>
      )
    }
    // Exemple de logique : si payé (seuil arbitraire, par exemple minerval à 250 USD)
    // À ajuster selon les frais réels de votre établissement
    const totalEquivUSD = info.totalUSD + info.totalFC / 2500 // Taux indicatif ou selon vos règles
    if (totalEquivUSD >= 250) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full font-medium">
          <CheckCircle2 className="size-3.5" /> Réglée
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full font-medium">
        <AlertTriangle className="size-3.5" /> Incomplète
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil Financier"
        subtitle="Suivi individuel de la scolarité et de l'état des paiements."
      />

      {/* 1. CARTE PROFIL ÉLÈVE */}
      <div className="p-6 rounded-3xl bg-card border border-border flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-2xl bg-sacred-red/10 text-sacred-red grid place-items-center shrink-0">
            <User className="size-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {getStudentFullName(student)}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm opacity-70">
              <span className="flex items-center gap-1">
                <GraduationCap className="size-4" />
                {student.currentClassName || 'Classe non assignée'}
              </span>
              <span className="size-1 bg-border rounded-full hidden sm:inline" />
              <span className="flex items-center gap-1">
                <Calendar className="size-4" />
                Année : {currentSchoolYear}
              </span>
            </div>
            <p className="text-[11px] opacity-40 mt-1 font-mono">
              ID: {student.id}
            </p>
          </div>
        </div>

        {/* Totaux rapides */}
        <div className="flex gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-initial p-4 rounded-2xl bg-background border border-border/60 text-center md:text-left min-w-30">
            <p className="text-xs opacity-50 font-medium">Total payé (USD)</p>
            <p className="text-lg font-bold text-foreground mt-0.5">
              {totals.USD} USD
            </p>
          </div>
          <div className="flex-1 md:flex-initial p-4 rounded-2xl bg-background border border-border/60 text-center md:text-left min-w-30">
            <p className="text-xs opacity-50 font-medium">Total payé (FC)</p>
            <p className="text-lg font-bold text-foreground mt-0.5">
              {totals.FC} FC
            </p>
          </div>
        </div>
      </div>

      {/* 2. SUIVI DES TRANCHES */}
      <div>
        <h3 className="font-display text-lg font-semibold mb-3">
          État des tranches (Minerval)
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {([1, 2, 3] as const).map(t => {
            const info = trancheStatus[t]
            return (
              <div
                key={t}
                className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-between gap-4 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground/80">
                    Tranche {t}
                  </span>
                  {getTrancheBadge(t)}
                </div>

                <div className="space-y-1">
                  <p className="text-xs opacity-40">Versements enregistrés</p>
                  <div className="font-semibold text-sm">
                    {info.totalUSD > 0 && <div>{info.totalUSD} USD</div>}
                    {info.totalFC > 0 && <div>{info.totalFC} FC</div>}
                    {info.totalUSD === 0 && info.totalFC === 0 && (
                      <span className="text-xs opacity-40 font-normal">
                        Aucun versement
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. HISTORIQUE DES REÇUS */}
      <div>
        <h3 className="font-display text-lg font-semibold mb-3">
          Détail des transactions
        </h3>
        <div className="space-y-3">
          {isLoading ? (
            <p className="text-sm opacity-50 text-center py-6">
              Chargement des reçus...
            </p>
          ) : studentReceipts.length === 0 ? (
            <p className="text-sm opacity-50 text-center py-6 border border-dashed border-border rounded-2xl bg-card/40">
              Aucun versement n'a encore été enregistré pour cet élève cette
              année.
            </p>
          ) : (
            studentReceipts.map(r => {
              const displayReceiptNum = `REC-${r.id.substring(0, 8).toUpperCase()}`

              return (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between gap-4 hover:border-border/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-sacred-red/10 text-sacred-red grid place-items-center shrink-0">
                      <Receipt className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">
                          {displayReceiptNum}
                        </p>
                        <span className="px-2 py-0.5 rounded bg-border text-[10px] font-medium opacity-80">
                          Tranche {r.tranche}
                        </span>
                      </div>
                      <p className="text-xs opacity-60 mt-0.5">
                        Encaissé par {r.cashierName || 'Caisse'} ·{' '}
                        {r.reason || 'Minerval'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm whitespace-nowrap">
                      {r.amount} {r.currency || 'USD'}
                    </p>
                    {/* Optionnel : date du paiement s'il est présent */}
                    {'paidAt' in r && r.paidAt && (
                      <p className="text-[10px] opacity-40 mt-0.5">
                        {new Date(r.paidAt as string).toLocaleDateString(
                          'fr-FR'
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
