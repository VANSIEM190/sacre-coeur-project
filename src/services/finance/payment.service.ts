import type { PaymentReceipt } from '@/lib/types'
import { supabase } from '@/supabase/supabaseClient'

// Validation de format UUID standard (Sécurité anti-injection)
const isValidUUID = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

class PaymentService {
  // 1. LIRE TOUS LES PAIEMENTS
  async getStudentPayment(): Promise<PaymentReceipt[]> {
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .order('schoolYear', { ascending: false }) // Tri en camelCase

    if (paymentError) throw paymentError
    if (!paymentData) return []

    // Pas besoin de remappage complexe, conversion directe du montant numérique
    return paymentData.map(p => ({
      id: p.id,
      studentId: p.studentId,
      studentName: p.studentName,
      tranche: p.tranche,
      schoolYear: p.schoolYear,
      currency: p.currency,
      amount: Number(p.amount),
      cashierName: p.cashierName,
      reason: p.reason,
      paidAt: p.paidAt,
    }))
  }

  // 2. CRÉER UN PAIEMENT
  async createPayment(
    values: Omit<PaymentReceipt, 'id' | 'paidAt'>
  ): Promise<PaymentReceipt> {
    if (!values || !values.studentId || !values.studentName) {
      throw new Error('Données incomplètes pour générer le paiement.')
    }

    if (!isValidUUID(values.studentId)) {
      throw new Error("Identifiant de l'élève invalide.")
    }

    if (Number(values.amount) <= 0) {
      throw new Error('Le montant du paiement doit être supérieur à zéro.')
    }

    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert([
        {
          studentId: values.studentId,
          studentName: values.studentName.trim(),
          tranche: values.tranche,
          schoolYear: values.schoolYear.trim(),
          amount: Number(values.amount),
          cashierName: values.cashierName.trim(),
          reason: values.reason.trim(),
        },
      ])
      .select()
      .single()

    if (paymentError) throw paymentError
    if (!paymentData) throw new Error('Échec du retour de la transaction.')

    return {
      id: paymentData.id,
      studentId: paymentData.studentId,
      studentName: paymentData.studentName,
      tranche: paymentData.tranche,
      schoolYear: paymentData.schoolYear,
      currency: paymentData.currency,
      reason: paymentData.reason,
      amount: Number(paymentData.amount),
      cashierName: paymentData.cashierName,
      paidAt: paymentData.paidAt,
    }
  }

  // 3. METTRE À JOUR UN PAIEMENT
  async updatePayment(
    id: string,
    values: Partial<Omit<PaymentReceipt, 'id' | 'paidAt' | 'studentId'>>
  ): Promise<PaymentReceipt> {
    if (!id || !isValidUUID(id)) {
      throw new Error('Identifiant de transaction invalide ou corrompu.')
    }

    if (values.amount !== undefined && Number(values.amount) <= 0) {
      throw new Error('Le montant modifié doit être supérieur à zéro.')
    }

    // Typage strict de l'objet de mise à jour pour éviter les erreurs TypeScript
    const updateData: Partial<
      Omit<PaymentReceipt, 'id' | 'paidAt' | 'studentId'>
    > = {}

    if (values.studentName !== undefined)
      updateData.studentName = values.studentName.trim()
    if (values.tranche !== undefined) updateData.tranche = values.tranche
    if (values.schoolYear !== undefined)
      updateData.schoolYear = values.schoolYear.trim()
    if (values.amount !== undefined) updateData.amount = Number(values.amount)
    if (values.cashierName !== undefined)
      updateData.cashierName = values.cashierName.trim()
    if (values.reason !== undefined) updateData.reason = values.reason.trim()

    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (paymentError) throw paymentError
    if (!paymentData) throw new Error('Aucune transaction trouvée à modifier.')

    return {
      id: paymentData.id,
      studentId: paymentData.studentId,
      studentName: paymentData.studentName,
      tranche: paymentData.tranche,
      currency: paymentData.currency,
      schoolYear: paymentData.schoolYear,
      reason: paymentData.reason,
      amount: Number(paymentData.amount),
      cashierName: paymentData.cashierName,
      paidAt: paymentData.paidAt,
    }
  }

  // 4. SUPPRIMER UN PAIEMENT
  async deletePayment(id: string): Promise<boolean> {
    if (!id || !isValidUUID(id)) {
      throw new Error('Identifiant de suppression invalide.')
    }

    const { error: paymentError } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)

    if (paymentError) throw paymentError
    return true
  }
}

export const paymentService = new PaymentService()
