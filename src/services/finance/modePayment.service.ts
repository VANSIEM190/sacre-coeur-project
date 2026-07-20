import type { ClassFeeConfig } from '@/lib/types'
import { supabase } from '@/supabase/supabaseClient'

// Validation de format UUID standard (Sécurité anti-injection)
const isValidUUID = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

class ModePaymentService {
  async getClassesPayment(): Promise<ClassFeeConfig[]> {
    const { data: paymentData, error: paymentError } = await supabase
      .from('mode_paiement')
      .select('*')
      .order('schoolYear', { ascending: false })

    if (paymentError) throw paymentError
    if (!paymentData) return []

    return paymentData.map(p => ({
      id: p.id,
      classId: p.class_id,
      className: p.class_name,
      tranche: p.tranche,
      schoolYear: p.schoolYear,
      currency: p.currency,
      amount: Number(p.amount),
      reason: p.reason,
      paidAt: p.created_at,
    }))
  }

  // 2. CRÉER UNE FIXATION
  async createModePayment(
    values: Omit<ClassFeeConfig, 'id' | 'paidAt'>
  ): Promise<ClassFeeConfig> {
    if (!values || !values.classId || !values.className) {
      throw new Error('Données incomplètes pour générer le paiement.')
    }

    if (!isValidUUID(values.classId)) {
      throw new Error("Identifiant de l'élève invalide.")
    }

    if (Number(values.amount) <= 0) {
      throw new Error('Le montant du paiement doit être supérieur à zéro.')
    }

    const { data: paymentData, error: paymentError } = await supabase
      .from('mode_paiement')
      .insert([
        {
          class_id: values.classId,
          className: values.className.trim(),
          tranche: values.tranche,
          schoolYear: values.schoolYear.trim(),
          amount: Number(values.amount),
          reason: values.reason.trim(),
        },
      ])
      .select()
      .single()

    if (paymentError) throw paymentError
    if (!paymentData) throw new Error('Échec du retour de la transaction.')

    return {
      id: paymentData.id,
      classId: paymentData.student_id,
      className: paymentData.className,
      tranche: paymentData.tranche,
      schoolYear: paymentData.schoolYear,
      currency: paymentData.currency,
      reason: paymentData.reason,
      amount: Number(paymentData.amount),
      paidAt: paymentData.paidAt,
    }
  }

  // 3. METTRE À JOUR UNE FIXATION
  async updateModePayment(
    id: string,
    values: Partial<Omit<ClassFeeConfig, 'id' | 'paidAt' | 'classId'>>
  ): Promise<ClassFeeConfig> {
    if (!id || !isValidUUID(id)) {
      throw new Error('Identifiant de transaction invalide ou corrompu.')
    }

    if (values.amount !== undefined && Number(values.amount) <= 0) {
      throw new Error('Le montant modifié doit être supérieur à zéro.')
    }

    // Typage strict de l'objet de mise à jour pour éviter les erreurs TypeScript
    const updateData: Partial<
      Omit<ClassFeeConfig, 'id' | 'paidAt' | 'studentId'>
    > = {}

    if (values.className !== undefined)
      updateData.className = values.className.trim()
    if (values.tranche !== undefined) updateData.tranche = values.tranche
    if (values.schoolYear !== undefined)
      updateData.schoolYear = values.schoolYear.trim()
    if (values.amount !== undefined) updateData.amount = Number(values.amount)
    if (values.reason !== undefined) updateData.reason = values.reason.trim()

    const { data: paymentData, error: paymentError } = await supabase
      .from('mode_paiement')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (paymentError) throw paymentError
    if (!paymentData) throw new Error('Aucune transaction trouvée à modifier.')

    return {
      id: paymentData.id,
      classId: paymentData.class_id,
      className: paymentData.studentName,
      tranche: paymentData.tranche,
      currency: paymentData.currency,
      schoolYear: paymentData.schoolYear,
      reason: paymentData.reason,
      amount: Number(paymentData.amount),
      paidAt: paymentData.paidAt,
    }
  }

  // 4. SUPPRIMER UNE FIXATIO DU MONTANT
  async deleteModePayment(id: string): Promise<boolean> {
    if (!id || !isValidUUID(id)) {
      throw new Error('Identifiant de suppression invalide.')
    }

    const { error: paymentError } = await supabase
      .from('mode_paiement')
      .delete()
      .eq('id', id)

    if (paymentError) throw paymentError
    return true
  }
}

export const modePaymentService = new ModePaymentService()
