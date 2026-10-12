
import { supabase } from '../../supabase/supabaseClient'
import type { Inscription, InscriptionStatus } from '@sacre-coeur/domain/types'
import { DomainError } from '@sacre-coeur/domain/errors'
import { requireText, requireUuid } from '@sacre-coeur/domain/validation'
import { settingsService } from '../settings/settings.service'

export interface CreateInscriptionDTO {
  eleveId: string
  classeId: string
  anneeScolaire: string
}

class InscriptionService {
  async createInscription(params: CreateInscriptionDTO): Promise<Inscription> {
    const { eleveId, classeId } = params
    requireUuid(eleveId, "Identifiant de l'élève")
    requireUuid(classeId, 'Identifiant de classe')
    const anneeScolaire = requireText(params.anneeScolaire, 'Année scolaire')
    const existing = await this.getStudentInscription(eleveId, anneeScolaire)
    if (existing) throw new DomainError('Une demande existe déjà pour cet élève et cette année scolaire.')
    const { data, error } = await supabase.from('inscriptions')
      .insert({ eleve_id: eleveId, classe_id: classeId, annee_scolaire: anneeScolaire, status: 'en_attente' })
      .select().single()
    if (error) throw error
    return data
  }

  /** Le contrôle client améliore le flux ; une règle en base reste nécessaire contre les écritures concurrentes. */
  async requestReenrollment(params: CreateInscriptionDTO): Promise<Inscription> {
    if (!await settingsService.isReenrollmentOpen()) throw new DomainError('Les réinscriptions sont fermées.')
    return this.createInscription(params)
  }

  async getStudentInscription(eleveId: string, anneeScolaire: string): Promise<Inscription | null> {
    requireUuid(eleveId, "Identifiant de l'élève")
    const { data, error } = await supabase.from('inscriptions').select('*')
      .eq('eleve_id', eleveId).eq('annee_scolaire', requireText(anneeScolaire, 'Année scolaire')).maybeSingle()
    if (error) throw error
    return data
  }

  async updateInscriptionStatus(inscriptionId: string, status: InscriptionStatus): Promise<Inscription> {
    requireUuid(inscriptionId, "Identifiant d'inscription")
    if (status !== 'accepte' && status !== 'rejete') throw new DomainError('Statut de validation invalide.')
    const { data, error } = await supabase.from('inscriptions').update({ status }).eq('id', inscriptionId).select().single()
    if (error) throw error
    return data
  }
}

export const inscriptionService = new InscriptionService()
