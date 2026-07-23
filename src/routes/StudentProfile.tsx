import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/Dashboard-shell'
import { useFetchData, useMutateData } from '@/hooks/useQuery'
import { paymentService } from '@/services/finance/payment.service'
import { modePaymentService } from '@/services/finance/modePayment.service'
import { classService } from '@/services/classe/classe.service'
import { settingsService } from '@/services/settings/settings.service'
import { inscriptionService } from '@/services/student/inscription.service'
import { getEligibleReenrollmentClasses } from '@/utils/getEligibleReenrollmentClasses'
import { getCurrentSchoolYear } from '@/utils/getCurrentSchoolYear'
import type {
  EleveDetails,
  ClassName,
  PaymentReceipt,
  ClassFeeConfig,
} from '@/lib/types'
import {
  User,
  Calendar,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserPlus,
  X,
  Loader2,
  Lock,
} from 'lucide-react'

interface StudentProfileProps {
  student: EleveDetails
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

const getStudentFullName = (s: Partial<EleveDetails>): string => {
  return [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ')
}

export default function StudentProfile({ student }: StudentProfileProps) {
  const currentSchoolYear = getCurrentSchoolYear()

  // --- ÉTATS POUR LA MODALE DE RÉINSCRIPTION ---
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isReenrollmentOpen, setIsReenrollmentOpen] = useState(false)
  const [eligibleClasses, setEligibleClasses] = useState<ClassName[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [isLoadingEligibility, setIsLoadingEligibility] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // 1. Récupération des reçus de paiement de l'élève
  const { data: receipts = [], isLoading: isLoadingPayments } = useFetchData<
    PaymentReceipt[]
  >(['payments', student.id], () => paymentService.getStudentPayment())

  // 2. Récupération des configurations de frais (fixations des montants)
  const { data: feeConfigs = [], isLoading: isLoadingConfigs } = useFetchData<
    ClassFeeConfig[]
  >(['classFeeConfigs'], () => modePaymentService.getClassesPayment())

  // Mutation pour créer une réinscription
  const reenrollMutation = useMutateData(
    (payload: { eleveId: string; classeId: string; anneeScolaire: string }) =>
      inscriptionService.createInscription(payload),
    {
      onSuccess: () => {
        setFeedbackMessage({
          type: 'success',
          text: 'Demande de réinscription enregistrée avec succès !',
        })
        setTimeout(() => {
          setIsModalOpen(false)
        }, 1500)
      },
      onError: () => {
        setFeedbackMessage({
          type: 'error',
          text: 'Une erreur est survenue lors de la réinscription.',
        })
      },
    }
  )

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

  // --- OUVERTURE ET PRÉPARATION DE LA MODALE ---
  const handleOpenReenrollmentModal = async () => {
    setIsLoadingEligibility(true)
    setFeedbackMessage(null)
    setIsModalOpen(true)

    try {
      const isOpen = await settingsService.isReenrollmentOpen()
      setIsReenrollmentOpen(isOpen)

      if (isOpen && student.currentClassName) {
        const allClasses = await classService.getAllClasses()

        // 1. Trouver l'objet classe correspondant à l'ID stocké dans currentClassName
        const currentClassObj = allClasses.find(
          c => c.id === student.currentClassName
        )

        // 2. Extraire le vrai nom (ex: "8ème") ou utiliser student.currentClassName s'il contenait déjà le nom
        const currentClassNameString = currentClassObj
          ? currentClassObj.nom_classe
          : student.currentClassName

        // 3. Calculer les classes éligibles avec le vrai nom nettoyé
        const eligible = getEligibleReenrollmentClasses(
          currentClassNameString,
          allClasses
        )

        setEligibleClasses(eligible)

        if (eligible.length === 1) {
          setSelectedClassId(eligible[0].id)
        }
      }
    } catch (error) {
      console.error('[ReenrollmentModal]:', error)
      setFeedbackMessage({
        type: 'error',
        text: 'Impossible de vérifier la réinscription pour le moment.',
      })
    } finally {
      setIsLoadingEligibility(false)
    }
  }

  // --- SOUMISSION DU FORMULAIRE DE RÉINSCRIPTION ---
  const handleReenrollSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClassId) return

    reenrollMutation.mutate({
      eleveId: student.id,
      classeId: selectedClassId,
      anneeScolaire: currentSchoolYear,
    })
  }

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

  if (isLoadingPayments || isLoadingConfigs) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin text-sacred-red" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil Financier & Scolaire"
        subtitle="Suivi individuel de la scolarité et contrôle d'accès aux résultats."
      />

      {/* 1. CARTE PROFIL ÉLÈVE AVEC BOUTON RÉINSCRIPTION */}
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

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-stretch sm:items-center">
          <div className="flex gap-4">
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

          <button
            onClick={handleOpenReenrollmentModal}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sacred-red text-white font-semibold shadow-md hover:bg-sacred-red/90 transition-all active:scale-[0.98] shrink-0"
          >
            <UserPlus className="size-5" />
            Réinscription
          </button>
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
                className="p-5 rounded-3xl bg-card border border-border space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold opacity-80">
                    Tranche {t}
                  </span>
                  {getTrancheBadge(t)}
                </div>
                <div className="space-y-1 pt-2 border-t border-border/60 text-xs">
                  <div className="flex justify-between">
                    <span className="opacity-60">Payé USD :</span>
                    <span className="font-semibold">
                      {info.paidUSD} / {info.requiredUSD} USD
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Payé FC :</span>
                    <span className="font-semibold">
                      {info.paidFC} / {info.requiredFC} FC
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 4. HISTORIQUE ET TÉLÉCHARGEMENT DES REÇUS */}
      <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
        <h3 className="font-display text-lg font-semibold">
          Reçus de paiement
        </h3>

        {studentReceipts.length === 0 ? (
          <p className="text-sm opacity-60">
            Aucun reçu trouvé pour cette année scolaire.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {studentReceipts.map(receipt => (
              <div
                key={receipt.id}
                className="py-3 flex items-center justify-between gap-4 text-sm"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    Reçu #{receipt.id.slice(0, 8)}
                  </p>
                  <p className="text-xs opacity-60">
                    Tranche {receipt.tranche} •{' '}
                    {new Date(receipt.paidAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-bold text-sacred-red">
                    {receipt.amount} {receipt.currency}
                  </span>

                  {/* Bouton de Téléchargement du reçu */}
                  <button
                    onClick={() =>
                      window.open(
                        `/api/receipts/download/${receipt.id}`,
                        '_blank'
                      )
                    }
                    className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1.5"
                  >
                    Télécharger
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. MODALE DE RÉINSCRIPTION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="size-5" />
            </button>

            <div>
              <h3 className="font-display text-xl font-bold">
                Réinscription Scolaire
              </h3>
              <p className="text-sm opacity-60 mt-1">
                Année Académique : {currentSchoolYear}
              </p>
            </div>

            {isLoadingEligibility ? (
              <div className="flex justify-center py-8">
                <Loader2 className="size-6 animate-spin text-sacred-red" />
              </div>
            ) : !isReenrollmentOpen ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-amber-600">
                <Lock className="size-5 shrink-0 mt-0.5" />
                <p className="text-sm">
                  Les réinscriptions ne sont pas encore ouvertes par
                  l'administration.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReenrollSubmit} className="space-y-4">
                {feedbackMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs font-medium ${
                      feedbackMessage.type === 'success'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {feedbackMessage.text}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider opacity-70 mb-2">
                    Classe Visée
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={e => setSelectedClassId(e.target.value)}
                    className="w-full p-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-sacred-red"
                    required
                  >
                    <option value="">Sélectionnez une classe</option>
                    {eligibleClasses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nom_classe}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-full border border-border text-sm font-semibold hover:bg-muted"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={reenrollMutation.isPending || !selectedClassId}
                    className="px-6 py-2.5 rounded-full bg-sacred-red text-white text-sm font-semibold shadow-md hover:scale-105 transition-transform disabled:opacity-50"
                  >
                    {reenrollMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      'Confirmer'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
