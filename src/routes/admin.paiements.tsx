import { useState, useMemo, useRef, useEffect } from 'react'
import { PageHeader } from '@/components/Dashboard-shell'
import { useFetchData, useMutateData } from '@/hooks/useQuery'
import { paymentService } from '@/services/finance/payment.service'
import { filterElement } from '@/utils/filterElements'
import type { StudentUser, PaymentTranche, PaymentReceipt } from '@/lib/types'
import { Plus, Receipt, Search, Filter } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { studentService } from '@/services/student/Student.service'

const sanitizeInput = (val: string): string => {
  return val.replace(/[<>]/g, '').trim()
}

// Helper pour formater le nom complet à partir des champs séparés
const getStudentFullName = (s: Partial<StudentUser>) => {
  return [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ')
}

function AdminPaiements() {
  const queryClient = useQueryClient()

  // 1. Récupération de TOUS les élèves (Admin)
  const { data: students = [] } = useFetchData<StudentUser[]>(
    ['admin', 'students-list'],
    () => studentService.getAllStudents()
  )

  // 2. Récupération des reçus
  const { data: receipts = [] } = useFetchData<PaymentReceipt[]>(
    ['payments'],
    () => paymentService.getStudentPayment()
  )

  // 3. Mutation pour créer le reçu
  const { mutate: createReceipt } = useMutateData<
    PaymentReceipt,
    Error,
    Omit<PaymentReceipt, 'id' | 'paidAt'>
  >(newPayment => paymentService.createPayment(newPayment), {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
    },
  })

  // États du Formulaire
  const [studentId, setStudentId] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [tranche, setTranche] = useState<PaymentTranche>(1)
  const [amount, setAmount] = useState(250)
  const [cashier, setCashier] = useState('')
  const [schoolYear, setSchoolYear] = useState('2025-2026')
  const [reason, setReason] = useState('Minerval')

  // États de Filtrage de la Liste
  const [filterSearch, setFilterSearch] = useState('')
  const [filterYear, setFilterYear] = useState('all')

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Moteur de recherche d'élèves prenant en compte lastName, firstName et middleName
  const matchingStudents = useMemo(() => {
    const cleanQuery = studentSearch.trim().toLowerCase()

    // Associe chaque élève à son nom complet calculé pour faciliter le filtrage textuel
    const studentsWithFullName = students.map(s => ({
      ...s,
      calculatedFullName: getStudentFullName(s),
    }))

    if (!cleanQuery) return studentsWithFullName.slice(0, 8)

    return studentsWithFullName
      .filter(
        s =>
          s.calculatedFullName.toLowerCase().includes(cleanQuery) ||
          (s.currentClassName &&
            s.currentClassName.toLowerCase().includes(cleanQuery))
      )
      .slice(0, 8)
  }, [students, studentSearch])

  // Utilisation de filterElement pour la table des reçus
  const filteredReceipts = useMemo(() => {
    return filterElement<PaymentReceipt>({
      items: receipts,
      keys: ['studentName', 'reason', 'id'],
      searchQuery: filterSearch,
      selectKey: 'schoolYear',
      selectedValue: filterYear === 'all' ? 'Tous' : filterYear,
    })
  }, [receipts, filterSearch, filterYear])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()

    const cleanStudentId = sanitizeInput(studentId)
    const cleanStudentName = sanitizeInput(studentSearch)
    const cleanCashier = sanitizeInput(cashier)
    const cleanSchoolYear = sanitizeInput(schoolYear)
    const cleanReason = sanitizeInput(reason)
    const validatedAmount = Math.max(0, Math.abs(amount))

    if (!cleanStudentId || !cleanCashier || validatedAmount === 0) return

    createReceipt({
      studentId: cleanStudentId,
      studentName: cleanStudentName,
      tranche,
      amount: validatedAmount,
      // currency: 'USD',
      schoolYear: cleanSchoolYear,
      cashierName: cleanCashier,
      reason: cleanReason,
    })

    setStudentId('')
    setStudentSearch('')
    setCashier('')
  }

  return (
    <div>
      <PageHeader
        title="Paiements & Reçus"
        subtitle="Enregistrez les paiements minerval encaissés à la caisse."
      />

      <form
        onSubmit={submit}
        className="p-6 rounded-3xl bg-card border border-border mb-8 grid sm:grid-cols-2 gap-4"
      >
        {/* Recherche par nom complet calculé */}
        <div
          ref={dropdownRef}
          className="relative flex flex-col sm:col-span-2 md:col-span-1"
        >
          <div className="relative">
            <Search className="absolute left-3 top-3.5 size-4 opacity-40" />
            <input
              type="text"
              placeholder="Rechercher un élève par nom..."
              value={studentSearch}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={e => {
                setStudentSearch(e.target.value)
                setIsDropdownOpen(true)
                if (studentId) setStudentId('')
              }}
              required
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-sacred-red"
            />
          </div>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 w-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto hidden-scrollbar">
              {matchingStudents.length === 0 ? (
                <div className="px-4 py-3 text-xs opacity-50">
                  Aucun élève trouvé
                </div>
              ) : (
                matchingStudents.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setStudentId(s.id)
                      setStudentSearch(s.calculatedFullName)
                      setIsDropdownOpen(false)
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-background/80 border-b border-border/40 last:border-0 flex justify-between items-center transition-colors"
                  >
                    <span className="font-medium">{s.calculatedFullName}</span>
                    <span className="text-xs opacity-50 bg-border/40 px-2 py-0.5 rounded-md">
                      {s.currentClassName || 'Sans classe'}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
          <input type="hidden" value={studentId} required />
        </div>

        <select
          value={tranche}
          onChange={e => setTranche(Number(e.target.value) as PaymentTranche)}
          className="px-4 py-3 rounded-xl border border-border bg-background text-sm"
        >
          <option value={1}>Tranche 1</option>
          <option value={2}>Tranche 2</option>
          <option value={3}>Tranche 3</option>
        </select>

        <select
          value={schoolYear}
          onChange={e => setSchoolYear(e.target.value)}
          className="px-4 py-3 rounded-xl border border-border bg-background text-sm"
        >
          <option value="2025-2026">2025-2026</option>
          <option value="2024-2025">2024-2025</option>
          <option value="2023-2024">2023-2024</option>
        </select>

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

        <input
          type="number"
          value={amount}
          min="1"
          onChange={e => setAmount(Number(e.target.value))}
          required
          placeholder="Montant USD"
          className="px-4 py-3 rounded-xl border border-border bg-background text-sm"
        />

        <input
          type="text"
          value={cashier}
          onChange={e => setCashier(e.target.value)}
          required
          placeholder="Nom du caissier"
          className="px-4 py-3 rounded-xl border border-border bg-background text-sm sm:col-span-2 md:col-span-1"
        />

        <button
          type="submit"
          className="sm:col-span-2 px-5 py-3 rounded-full bg-sacred-red text-white font-semibold flex items-center justify-center gap-2 text-sm transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" /> Générer le reçu
        </button>
      </form>

      {/* FILTRAGE ET RECHERCHE DU BAS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="font-display text-2xl">Reçus émis</h2>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <Filter className="absolute left-3 top-3 size-4 opacity-40" />
            <input
              type="text"
              placeholder="Filtrer par élève, reçu, motif..."
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

      <div className="space-y-3">
        {filteredReceipts.length === 0 ? (
          <p className="text-sm opacity-50 text-center py-6 border border-dashed border-border rounded-2xl">
            Aucun reçu trouvé pour ces critères.
          </p>
        ) : (
          filteredReceipts.map(r => {
            const currentStudent = students.find(x => x.id === r.studentId)
            const displayReceiptNum =
              (r as any).receiptNumber ||
              `REC-${r.id.substring(0, 8).toUpperCase()}`

            // Reconstitution du nom s'il n'est pas stocké en dur dans le reçu
            const studentFallbackName = currentStudent
              ? getStudentFullName(currentStudent)
              : 'Élève inconnu'

            return (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-sacred-red/10 text-sacred-red grid place-items-center shrink-0">
                    <Receipt className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{displayReceiptNum}</p>
                    <p className="text-xs opacity-60">
                      {r.studentName || studentFallbackName} · Tranche{' '}
                      {r.tranche} · {r.schoolYear}
                    </p>
                    {r.reason && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded bg-border text-[10px] font-medium opacity-80">
                        {r.reason}
                      </span>
                    )}
                  </div>
                </div>
                <p className="font-semibold text-sm whitespace-nowrap">
                  {r.amount} {'USD'}
                </p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default AdminPaiements
