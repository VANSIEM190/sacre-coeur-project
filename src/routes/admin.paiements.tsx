import { useState } from 'react'
import { PageHeader } from '@/components/dashboard-shell'
import { useSchoolStore } from '@/stores/school-store'
import { useAuthStore } from '@/stores/auth-store'
import { ALL_CLASS_NAMES } from '@/lib/mock-seed'
import type { SchoolClassName, StudentUser, PaymentTranche } from '@/lib/types'
import { Plus, Receipt } from 'lucide-react'

function AdminPaiements() {
  const users = useAuthStore(s => s.registeredUsers)
  const receipts = useSchoolStore(s => s.receipts)
  const create = useSchoolStore(s => s.createReceipt)
  const students = users.filter((u): u is StudentUser => u.role === 'student')

  const [studentId, setStudentId] = useState('')
  const [tranche, setTranche] = useState<PaymentTranche>(1)
  const [amount, setAmount] = useState(250)
  const [cashier, setCashier] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId || !cashier) return
    create({
      studentId,
      tranche,
      amount,
      currency: 'USD',
      schoolYear: '2024-2025',
      cashierName: cashier,
    })
    setStudentId('')
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
        <select
          value={studentId}
          onChange={e => setStudentId(e.target.value)}
          required
          className="px-4 py-3 rounded-xl border border-border bg-background"
        >
          <option value="">Choisir un élève…</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>
              {s.fullName} — {s.currentClassName}
            </option>
          ))}
        </select>
        <select
          value={tranche}
          onChange={e => setTranche(Number(e.target.value) as PaymentTranche)}
          className="px-4 py-3 rounded-xl border border-border bg-background"
        >
          <option value={1}>Tranche 1</option>
          <option value={2}>Tranche 2</option>
          <option value={3}>Tranche 3</option>
        </select>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          required
          placeholder="Montant USD"
          className="px-4 py-3 rounded-xl border border-border bg-background"
        />
        <input
          value={cashier}
          onChange={e => setCashier(e.target.value)}
          required
          placeholder="Nom du caissier"
          className="px-4 py-3 rounded-xl border border-border bg-background"
        />
        <button
          type="submit"
          className="sm:col-span-2 px-5 py-3 rounded-full bg-sacred-red text-white font-semibold flex items-center justify-center gap-2"
        >
          <Plus className="size-4" /> Générer le reçu
        </button>
      </form>

      <h2 className="font-display text-2xl mb-4">Reçus émis</h2>
      <div className="space-y-3">
        {receipts.map(r => {
          const s = students.find(x => x.id === r.studentId)
          return (
            <div
              key={r.id}
              className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-sacred-red/10 text-sacred-red grid place-items-center">
                  <Receipt className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{r.receiptNumber}</p>
                  <p className="text-xs opacity-60">
                    {s?.fullName ?? '—'} · Tranche {r.tranche}
                  </p>
                </div>
              </div>
              <p className="font-semibold">
                {r.amount} {r.currency}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AdminPaiements
