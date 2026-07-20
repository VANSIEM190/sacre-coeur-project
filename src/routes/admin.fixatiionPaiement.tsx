import { useState, useMemo } from 'react'
import { PageHeader } from '@/components/Dashboard-shell'
import { useFetchData, useMutateData } from '@/hooks/useQuery'
import { filterElement } from '@/utils/filterElements'
import { getCurrentSchoolYear } from '@/utils/getCurrentSchoolYear'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Settings, Filter, DollarSign } from 'lucide-react'
import { classService } from '@/services/classe/classe.service'
import type { ClassFeeConfig, ClassName } from '@/lib/types'
import { modePaymentService } from '@/services/finance/modePayment.service'

const sanitizeInput = (val: string): string => {
  return val.replace(/[<>]/g, '').trim()
}

function AdminFixationPaiement() {
  const queryClient = useQueryClient()

  // 1. Récupération des classes disponibles via l'architecture existante
  const { data: classes = [] } = useFetchData<ClassName[]>(
    ['studentClasses'],
    classService.getAllClasses
  )

  // 2. Récupération des configurations de frais déjà fixées
  const { data: feeConfigs = [] } = useFetchData<ClassFeeConfig[]>(
    ['class-fees-configs'],
    () => modePaymentService.getClassesPayment()
  )

  // 3. Mutation pour fixer/enregistrer le montant pour une classe
  const { mutate: fixClassFee } = useMutateData<
    ClassFeeConfig,
    Error,
    Omit<ClassFeeConfig, 'id' | 'paidAt'>
  >(newConfig => modePaymentService.createModePayment(newConfig), {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-fees-configs'] })
    },
  })

  // États du Formulaire
  const [classId, setClassId] = useState('')
  const [reason, setReason] = useState('Minerval')
  const [amount, setAmount] = useState(250)
  const [currency, setCurrency] = useState<'USD' | 'FC'>('USD')
  const [tranche, setTranche] = useState<1 | 2 | 3>(1)
  const [schoolYear] = useState(getCurrentSchoolYear())

  // États de Filtrage de la Liste du bas
  const [filterSearch, setFilterSearch] = useState('')
  const [filterYear, setFilterYear] = useState('all')

  const selectedClass = classes.find(c => c.id === classId)

  // Utilisation de filterElement pour la table des fixations
  const filteredConfigs = useMemo(() => {
    return filterElement<ClassFeeConfig>({
      items: feeConfigs,
      keys: ['className', 'reason'],
      searchQuery: filterSearch,
      selectKey: 'schoolYear',
      selectedValue: filterYear === 'all' ? 'Tous' : filterYear,
    })
  }, [feeConfigs, filterSearch, filterYear])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()

    const cleanClassId = sanitizeInput(classId)
    const cleanClassName = selectedClass
      ? selectedClass.nom_classe
      : 'Classe inconnue'
    const cleanReason = sanitizeInput(reason)
    const cleanCurrency = sanitizeInput(currency) as 'USD' | 'FC'
    const cleanSchoolYear = sanitizeInput(schoolYear)
    const validatedAmount = Math.max(0, Math.abs(amount))

    if (!cleanClassId || validatedAmount === 0) return

    fixClassFee({
      classId: cleanClassId,
      className: cleanClassName,
      tranche: tranche,
      reason: cleanReason,
      amount: validatedAmount,
      currency: cleanCurrency,
      schoolYear: cleanSchoolYear,
    })

    // Réinitialisation partielle (on garde l'année et la devise par confort UX)
    setClassId('')
    setAmount(250)
  }

  return (
    <div>
      <PageHeader
        title="Fixation des Frais"
        subtitle="Définissez et bloquez les montants des paiements obligatoires par classe."
      />

      <form
        onSubmit={submit}
        className="p-6 rounded-3xl bg-card border border-border mb-8 grid sm:grid-cols-2 gap-4"
      >
        {/* Sélection de la Classe */}
        <select
          value={classId}
          onChange={e => setClassId(e.target.value)}
          required
          className="px-4 py-3 rounded-xl border border-border bg-background text-sm"
        >
          <option value="" disabled>
            Sélectionner une classe...
          </option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>
              {c.nom_classe}
            </option>
          ))}
        </select>

        <select
          value={tranche}
          onChange={e => setTranche(Number(e.target.value) as 1 | 2 | 3)}
          className="px-4 py-3 rounded-xl border border-border bg-background text-sm"
        >
          <option value={1}>1ère Tranche</option>
          <option value={2}>2ème Tranche</option>
          <option value={3}>3ème Tranche</option>
        </select>

        {/* Motif du paiement */}
        <select
          value={reason}
          onChange={e => setReason(e.target.value)}
          className="px-4 py-3 rounded-xl border border-border bg-background text-sm"
        >
          <option value="Minerval">Minerval</option>
          <option value="Frais d'inscription">Frais d'inscription</option>
          <option value="Examen / Session">Examen / Session</option>
          <option value="Autres frais">Autres frais</option>
        </select>

        {/* Bloc Montant & Devise identique à la caisse */}
        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            min="1"
            onChange={e => setAmount(Number(e.target.value))}
            required
            placeholder="Montant fixé"
            className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm min-w-0"
          />
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value as 'USD' | 'FC')}
            className="px-3 py-3 rounded-xl border border-border bg-background text-sm font-semibold shrink-0"
          >
            <option value="USD">USD</option>
            <option value="FC">FC</option>
          </select>
        </div>

        {/* Année Scolaire en cours (Verrouillée) */}
        <input
          type="text"
          value={schoolYear}
          disabled
          readOnly
          className="px-4 py-3 rounded-xl border border-border bg-background/50 text-sm text-foreground/60 cursor-not-allowed"
          placeholder="Année Scolaire"
        />

        <button
          type="submit"
          className="sm:col-span-2 px-5 py-3 rounded-full bg-sacred-red text-white font-semibold flex items-center justify-center gap-2 text-sm transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" /> Fixer le tarif
        </button>
      </form>

      {/* SECTION CONTRÔLE ET VISUALISATION DES TARIFS FIXÉS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="font-display text-2xl">Frais Configurés</h2>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <Filter className="absolute left-3 top-3 size-4 opacity-40" />
            <input
              type="text"
              placeholder="Filtrer par classe, motif..."
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs w-full sm:w-64"
            />
          </div>
          <select
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-card text-xs"
          >
            <option value="all">Toutes les années</option>
            <option value="2025-2026">2025-2026</option>
            <option value="2024-2025">2024-2025</option>
            <option value="2023-2024">2023-2024</option>
          </select>
        </div>
      </div>

      {/* LISTE DES FRAIS FIXÉS */}
      <div className="space-y-3">
        {filteredConfigs.length === 0 ? (
          <p className="text-sm opacity-50 text-center py-6 border border-dashed border-border rounded-2xl">
            Aucun tarif fixé pour cette sélection.
          </p>
        ) : (
          filteredConfigs.map(c => (
            <div
              key={c.id}
              className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                {/* Icône Settings/Dollar violet/rouge en opacité réduite */}
                <div className="size-10 rounded-xl bg-sacred-red/10 text-sacred-red grid place-items-center shrink-0">
                  <Settings className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{c.className}</p>
                  <p className="text-xs opacity-60">Année : {c.schoolYear}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded bg-border text-[10px] font-medium opacity-80">
                    {c.reason}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold text-foreground whitespace-nowrap bg-background px-3 py-1.5 rounded-xl border border-border">
                <DollarSign className="size-3.5 opacity-60" />
                <span>
                  {c.amount} {c.currency}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AdminFixationPaiement
