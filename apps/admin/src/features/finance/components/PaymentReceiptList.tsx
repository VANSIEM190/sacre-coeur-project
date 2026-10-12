import { Receipt } from 'lucide-react'
import type { EleveDetails, PaymentReceipt } from '@sacre-coeur/domain/types'
import { getStudentFullName } from '../utils/payment-format'

interface PaymentReceiptListProps {
  receipts: PaymentReceipt[]
  students: EleveDetails[]
}

export function PaymentReceiptList({ receipts, students }: PaymentReceiptListProps) {
  if (!receipts.length) return <p className="rounded-2xl border border-dashed border-border py-6 text-center text-sm opacity-50">Aucun reçu trouvé pour ces critères.</p>
  return <div className="space-y-3">{receipts.map(receipt => {
    const currentStudent = students.find(student => student.id === receipt.studentId)
    const studentName = receipt.studentName || (currentStudent ? getStudentFullName(currentStudent) : 'Élève inconnu')
    return <article key={receipt.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4"><div className="flex items-center gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sacred-red/10 text-sacred-red"><Receipt className="size-5" /></div><div><p className="text-sm font-semibold">{`REC-${receipt.id.substring(0, 8).toUpperCase()}`}</p><p className="text-xs opacity-60">{studentName} · Tranche {receipt.tranche} · {receipt.schoolYear}</p>{receipt.reason && <span className="mt-1 inline-block rounded bg-border px-2 py-0.5 text-[10px] font-medium opacity-80">{receipt.reason}</span>}</div></div><p className="whitespace-nowrap text-sm font-semibold">{receipt.amount} {receipt.currency || 'USD'}</p></article>
  })}</div>
}
