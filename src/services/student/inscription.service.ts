import { supabase } from '@/supabase/supabaseClient'
import type { Inscription, InscriptionStatus } from '@/lib/types'

export interface CreateInscriptionDTO {
  eleveId: string
  classeId: string
  anneeScolaire: string
}

class InscriptionService {
  /**
   * Soumet une nouvelle demande d'inscription/réinscription pour un élève.
   */
  async createInscription(params: CreateInscriptionDTO): Promise<Inscription> {
    const { eleveId, classeId, anneeScolaire } = params

    if (!eleveId || !classeId || !anneeScolaire) {
      throw new Error('Paramètres d inscription incomplets.')
    }

    const { data, error } = await supabase
      .from('inscriptions')
      .insert({
        eleve_id: eleveId,
        classe_id: classeId,
        annee_scolaire: anneeScolaire,
        status: 'en_attente' as InscriptionStatus,
      })
      .select()
      .single()

    if (error) throw new Error(`Erreur création inscription : ${error.message}`)
    return data
  }

  /**
   * Récupère le statut d'inscription d'un élève pour une année donnée.
   */
  async getStudentInscription(
    eleveId: string,
    anneeScolaire: string
  ): Promise<Inscription | null> {
    if (!eleveId || !anneeScolaire) return null

    const { data, error } = await supabase
      .from('inscriptions')
      .select('*')
      .eq('eleve_id', eleveId)
      .eq('annee_scolaire', anneeScolaire)
      .maybeSingle()

    if (error)
      throw new Error(`Erreur vérification inscription : ${error.message}`)
    return data
  }

  /**
   * Validation / Rejet d'une inscription (Action Administrateur).
   */
  async updateInscriptionStatus(
    inscriptionId: string,
    status: InscriptionStatus
  ): Promise<Inscription> {
    if (!inscriptionId || !status) {
      throw new Error('Identifiant ou statut manquant.')
    }

    const { data, error } = await supabase
      .from('inscriptions')
      .update({ status })
      .eq('id', inscriptionId)
      .select()
      .single()

    if (error) throw new Error(`Erreur mise à jour statut : ${error.message}`)
    return data
  }
}

export const inscriptionService = new InscriptionService()
