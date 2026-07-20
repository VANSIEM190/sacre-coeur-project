import { useMemo } from 'react'
import { PageHeader } from '@/components/Dashboard-shell'
import { useFetchData } from '@/hooks/useQuery'
import { paymentService } from '@/services/finance/payment.service'
import { modePaymentService } from '@/services/finance/modePayment.service'
import type { StudentUser, PaymentReceipt, ClassFeeConfig } from '@/lib/types'
import {
  User,
  Receipt,
  Calendar,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lock,
  FileText,
  BarChart3,
} from 'lucide-react'
import { getCurrentSchoolYear } from '@/utils/getCurrentSchoolYear'

interface StudentProfileFinanceProps {
  student: StudentUser
}

type TrancheKey = 1 | 2 | 3
type CurrencyKey = 'USD' | 'FC'
type TrancheStatus = 'Non entamée' | 'Réglée' | 'Incomplète'

interface TrancheData {
  paidUSD: number
  paidFC: number
  requiredUSD: number
  requiredFC: number
  status: TrancheStatus
}

const getStudentFullName = (s: Partial<StudentUser>): string => {
  return [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ')
}

export default function StudentProfile({
  student,
}: StudentProfileFinanceProps) {
  const currentSchoolYear = getCurrentSchoolYear()

  // 1. Récupération des reçus de paiement de l'élève
  const { data: receipts = [], isLoading: isLoadingPayments } = useFetchData<
    PaymentReceipt[]
  >(['payments', student.id], () => paymentService.getStudentPayment())

  // 2. Récupération des configurations de frais (fixations des montants)
  const { data: feeConfigs = [], isLoading: isLoadingConfigs } = useFetchData<
    ClassFeeConfig[]
  >(['classFeeConfigs'], () => modePaymentService.getClassesPayment())

  const isLoading = isLoadingPayments || isLoadingConfigs

  // 3. Filtrage local des reçus pour cet élève et l'année en cours
  const studentReceipts = useMemo(() => {
    return receipts.filter(
      r => r.studentId === student.id && r.schoolYear === currentSchoolYear
    )
  }, [receipts, student.id, currentSchoolYear])

  // 4. Filtrage des configurations de frais pour la classe de l'élève
  const currentClassConfigs = useMemo(() => {
    return feeConfigs.filter(
      c =>
        c.className === student.currentClassName &&
        c.schoolYear === currentSchoolYear
    )
  }, [feeConfigs, student.currentClassName, currentSchoolYear])

  // 5. Calcul des totaux globaux payés par l'élève par devise
  const totals = useMemo(() => {
    return studentReceipts.reduce<Record<CurrencyKey, number>>(
      (acc, r) => {
        const currency: CurrencyKey = r.currency === 'FC' ? 'FC' : 'USD'
        acc[currency] += Number(r.amount || 0)
        return acc
      },
      { USD: 0, FC: 0 }
    )
  }, [studentReceipts])

  // 6. Analyse dynamique du statut financier par tranche
  const financialStatus = useMemo(() => {
    let isGloballyCompliant = true

    const tranches: Record<TrancheKey, TrancheData> = {
      1: {
        paidUSD: 0,
        paidFC: 0,
        requiredUSD: 0,
        requiredFC: 0,
        status: 'Non entamée',
      },
      2: {
        paidUSD: 0,
        paidFC: 0,
        requiredUSD: 0,
        requiredFC: 0,
        status: 'Non entamée',
      },
      3: {
        paidUSD: 0,
        paidFC: 0,
        requiredUSD: 0,
        requiredFC: 0,
        status: 'Non entamée',
      },
    }

    // Assigner les montants exigés par la direction depuis les configs réelles
    currentClassConfigs.forEach(cfg => {
      const t = Number(cfg.tranche) as TrancheKey
      if (tranches[t]) {
        if (cfg.currency === 'FC') {
          tranches[t].requiredFC = Number(cfg.amount || 0)
        } else {
          tranches[t].requiredUSD = Number(cfg.amount || 0)
        }
      }
    })

    // Cumuler ce que l'élève a réellement payé
    studentReceipts.forEach(r => {
      const t = Number(r.tranche) as TrancheKey
      if (tranches[t]) {
        if (r.currency === 'FC') {
          tranches[t].paidFC += Number(r.amount || 0)
        } else {
          tranches[t].paidUSD += Number(r.amount || 0)
        }
      }
    })

    // Détermination stricte de la conformité par tranche
    ;(Object.keys(tranches) as unknown as TrancheKey[]).forEach(key => {
      const t = Number(key) as TrancheKey
      const item = tranches[t]
      const hasPayments = item.paidUSD > 0 || item.paidFC > 0
      const meetsUSD = item.paidUSD >= item.requiredUSD
      const meetsFC = item.paidFC >= item.requiredFC

      if (!hasPayments) {
        item.status = 'Non entamée'
        if (item.requiredUSD > 0 || item.requiredFC > 0) {
          isGloballyCompliant = false
        }
      } else if (meetsUSD && meetsFC) {
        item.status = 'Réglée'
      } else {
        item.status = 'Incomplète'
        isGloballyCompliant = false
      }
    })

    return { tranches, isGloballyCompliant }
  }, [studentReceipts, currentClassConfigs])

  // Rendu visuel des badges selon l'état réel calculé
  const getTrancheBadge = (trancheNum: TrancheKey) => {
    const state = financialStatus.tranches[trancheNum].status
    if (state === 'Réglée') {
      return (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full font-medium">
          <CheckCircle2 className="size-3.5" /> Réglée
        </div>
      )
    }
    if (state === 'Incomplète') {
      return (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full font-medium">
          <AlertTriangle className="size-3.5" /> Incomplète
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full font-medium">
        <Clock className="size-3.5" /> Non entamée
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil Financier & Scolaire"
        subtitle="Suivi individuel de la scolarité et contrôle d'accès aux résultats."
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
          </div>
        </div>

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
            const info = financialStatus.tranches[t]
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
                    {info.requiredUSD > 0 || info.paidUSD > 0 ? (
                      <div>
                        {info.paidUSD} / {info.requiredUSD} USD
                      </div>
                    ) : null}
                    {info.requiredFC > 0 || info.paidFC > 0 ? (
                      <div>
                        {info.paidFC} / {info.requiredFC} FC
                      </div>
                    ) : null}
                    {info.paidUSD === 0 &&
                      info.paidFC === 0 &&
                      info.requiredUSD === 0 &&
                      info.requiredFC === 0 && (
                        <span className="text-xs opacity-40 font-normal">
                          Aucun frais configuré
                        </span>
                      )}
                    {info.paidUSD === 0 &&
                      info.paidFC === 0 &&
                      (info.requiredUSD > 0 || info.requiredFC > 0) && (
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

      {/* 🔒 ACCÈS RESTREINT : BLOC POINTS ET BULLETINS */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Section Points / Notes */}
        <div className="p-6 rounded-3xl bg-card border border-border relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <BarChart3 className="size-5 text-sacred-red" />
              <h3 className="font-display text-lg font-semibold">
                Points & Évaluations
              </h3>
            </div>
            {!financialStatus.isGloballyCompliant && (
              <Lock className="size-4 text-amber-600" />
            )}
          </div>

          {financialStatus.isGloballyCompliant ? (
            <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-2xl border border-border/50">
              Visualisation des points active. Vos résultats des sessions sont
              disponibles.
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center">
              <AlertTriangle className="size-8 text-amber-600 mb-2" />
              <p className="text-sm font-semibold text-amber-900">
                Accès restreint
              </p>
              <p className="text-xs text-amber-700/80 mt-1 max-w-xs">
                Veuillez apurer le solde de vos tranches pour débloquer l'accès
                à vos notes de cours.
              </p>
            </div>
          )}
        </div>

        {/* Section Bulletins */}
        <div className="p-6 rounded-3xl bg-card border border-border relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <FileText className="size-5 text-sacred-red" />
              <h3 className="font-display text-lg font-semibold">
                Bulletins & Périodes
              </h3>
            </div>
            {!financialStatus.isGloballyCompliant && (
              <Lock className="size-4 text-amber-600" />
            )}
          </div>

          {financialStatus.isGloballyCompliant ? (
            <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-2xl border border-border/50">
              Téléchargement disponible. Votre bulletin de fin de période est
              prêt.
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center">
              <AlertTriangle className="size-8 text-amber-600 mb-2" />
              <p className="text-sm font-semibold text-amber-900">
                Accès restreint
              </p>
              <p className="text-xs text-amber-700/80 mt-1 max-w-xs">
                La consultation et l'impression des bulletins scolaires
                requièrent la validation financière complète de vos tranches.
              </p>
            </div>
          )}
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
              Chargement des données...
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
                    {r.paidAt && (
                      <p className="text-[10px] opacity-40 mt-0.5">
                        {new Date(r.paidAt).toLocaleDateString('fr-FR')}
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
