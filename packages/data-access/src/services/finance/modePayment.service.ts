
import type { ClassFeeConfig } from '@sacre-coeur/domain/types'
import { DomainError } from '@sacre-coeur/domain/errors'
import { requireText, requireUuid, validateAmount, validateCurrency, validateTranche } from '@sacre-coeur/domain/validation'
import { supabase } from '../../supabase/supabaseClient'

type FeeInput = Omit<ClassFeeConfig, 'id' | 'paidAt'>
type FeeUpdate = Partial<Omit<FeeInput, 'classId'>>
interface FeeRow {
  id: string
  class_id: string
  class_name: string
  tranche: ClassFeeConfig['tranche']
  schoolYear: string
  amount: number | string
  currency: ClassFeeConfig['currency']
  reason: string
  created_at: string
}

/** Contrat repris de la lecture existante : class_id, class_name, created_at.
 * Le schéma distant doit être vérifié avant déploiement (aucun DDL présent dans le dépôt).
 */
function mapFee(row: FeeRow): ClassFeeConfig {
  if (!row.class_id || typeof row.class_name !== 'string' || !row.created_at) {
    throw new DomainError("La configuration des tarifs est incompatible avec la base. Contactez l'administration.")
  }
  validateAmount(Number(row.amount))
  validateCurrency(row.currency)
  validateTranche(row.tranche)
  return { id: row.id, classId: row.class_id, className: row.class_name, tranche: row.tranche,
    schoolYear: row.schoolYear, amount: Number(row.amount), currency: row.currency, reason: row.reason, paidAt: row.created_at }
}

function normalizeFee(values: FeeUpdate) {
  const payload: Partial<Omit<FeeRow, 'id' | 'created_at' | 'class_id'>> = {}
  if (values.className !== undefined) payload.class_name = requireText(values.className, 'Nom de classe')
  if (values.schoolYear !== undefined) payload.schoolYear = requireText(values.schoolYear, 'Année scolaire')
  if (values.reason !== undefined) payload.reason = requireText(values.reason, 'Motif')
  if (values.amount !== undefined) { validateAmount(values.amount); payload.amount = values.amount }
  if (values.currency !== undefined) { validateCurrency(values.currency); payload.currency = values.currency }
  if (values.tranche !== undefined) { validateTranche(values.tranche); payload.tranche = values.tranche }
  return payload
}

class ModePaymentService {
  async getClassesPayment(classId?: string, schoolYear?: string): Promise<ClassFeeConfig[]> {
    let query = supabase.from('mode_paiement').select('*').order('schoolYear', { ascending: false })
    if (classId) { requireUuid(classId, 'Identifiant de classe'); query = query.eq('class_id', classId) }
    if (schoolYear) query = query.eq('schoolYear', schoolYear)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(mapFee)
  }

  async createModePayment(values: FeeInput): Promise<ClassFeeConfig> {
    requireUuid(values.classId, 'Identifiant de classe')
    requireText(values.className, 'Nom de classe')
    requireText(values.schoolYear, 'Année scolaire')
    requireText(values.reason, 'Motif')
    validateAmount(values.amount)
    validateCurrency(values.currency)
    validateTranche(values.tranche)
    const { data, error } = await supabase.from('mode_paiement')
      .insert({ class_id: values.classId, ...normalizeFee(values) }).select().single()
    if (error) throw error
    return mapFee(data)
  }

  async updateModePayment(id: string, values: FeeUpdate): Promise<ClassFeeConfig> {
    requireUuid(id, 'Identifiant de tarif')
    const payload = normalizeFee(values)
    if (!Object.keys(payload).length) throw new Error('Aucune modification à appliquer.')
    const { data, error } = await supabase.from('mode_paiement').update(payload).eq('id', id).select().single()
    if (error) throw error
    return mapFee(data)
  }

  async deleteModePayment(id: string): Promise<boolean> {
    requireUuid(id, 'Identifiant de tarif')
    const { error } = await supabase.from('mode_paiement').delete().eq('id', id)
    if (error) throw error
    return true
  }
}

export const modePaymentService = new ModePaymentService()
