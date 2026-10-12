
import type { PaymentReceipt } from '@sacre-coeur/domain/types'
import { requireText, requireUuid, validateAmount, validateCurrency, validateTranche } from '@sacre-coeur/domain/validation'
import { supabase } from '../../supabase/supabaseClient'

type PaymentInput = Omit<PaymentReceipt, 'id' | 'paidAt'>
type PaymentUpdate = Partial<Omit<PaymentInput, 'studentId'>>
type PaymentRow = Omit<PaymentReceipt, 'amount'> & { amount: number | string }

function mapPayment(row: PaymentRow): PaymentReceipt {
  validateAmount(Number(row.amount))
  validateCurrency(row.currency)
  validateTranche(row.tranche)
  return { ...row, amount: Number(row.amount) }
}

function normalizePayment(values: PaymentUpdate): PaymentUpdate {
  const payload: PaymentUpdate = {}
  for (const key of ['studentName', 'schoolYear', 'cashierName', 'reason'] as const) {
    if (values[key] !== undefined) payload[key] = requireText(values[key], key)
  }
  if (values.amount !== undefined) { validateAmount(values.amount); payload.amount = values.amount }
  if (values.currency !== undefined) { validateCurrency(values.currency); payload.currency = values.currency }
  if (values.tranche !== undefined) { validateTranche(values.tranche); payload.tranche = values.tranche }
  return payload
}

class PaymentService {
  /** Les filtres sont appliqués dans la base, avant de charger les reçus. */
  async getStudentPayment(studentId?: string, schoolYear?: string): Promise<PaymentReceipt[]> {
    let query = supabase.from('payments').select('*').order('schoolYear', { ascending: false }).order('paidAt', { ascending: false })
    if (studentId) { requireUuid(studentId, "Identifiant de l'élève"); query = query.eq('studentId', studentId) }
    if (schoolYear) query = query.eq('schoolYear', schoolYear)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(mapPayment)
  }

  async getParentPayments(parentId: string, schoolYear?: string): Promise<PaymentReceipt[]> {
    requireUuid(parentId, 'Identifiant du parent')
    const { data: students, error: studentError } = await supabase.from('eleves_details').select('id').eq('parent_id', parentId)
    if (studentError) throw studentError
    if (!students?.length) return []
    let query = supabase.from('payments').select('*').in('studentId', students.map(student => student.id)).order('paidAt', { ascending: false })
    if (schoolYear) query = query.eq('schoolYear', schoolYear)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(mapPayment)
  }

  async createPayment(values: PaymentInput): Promise<PaymentReceipt> {
    requireUuid(values.studentId, "Identifiant de l'élève")
    const payload: PaymentInput = {
      studentId: values.studentId,
      studentName: requireText(values.studentName, "Nom de l'élève"),
      schoolYear: requireText(values.schoolYear, 'Année scolaire'),
      cashierName: requireText(values.cashierName, 'Nom du caissier'),
      reason: requireText(values.reason, 'Motif'),
      tranche: values.tranche, amount: values.amount, currency: values.currency,
    }
    validateAmount(payload.amount)
    validateCurrency(payload.currency)
    validateTranche(payload.tranche)
    const { data, error } = await supabase.from('payments').insert(payload).select().single()
    if (error) throw error
    return mapPayment(data)
  }

  async updatePayment(id: string, values: PaymentUpdate): Promise<PaymentReceipt> {
    requireUuid(id, 'Identifiant de paiement')
    const payload = normalizePayment(values)
    if (!Object.keys(payload).length) throw new Error('Aucune modification à appliquer.')
    const { data, error } = await supabase.from('payments').update(payload).eq('id', id).select().single()
    if (error) throw error
    return mapPayment(data)
  }

  async deletePayment(id: string): Promise<boolean> {
    requireUuid(id, 'Identifiant de paiement')
    const { error } = await supabase.from('payments').delete().eq('id', id)
    if (error) throw error
    return true
  }
}

export const paymentService = new PaymentService()
