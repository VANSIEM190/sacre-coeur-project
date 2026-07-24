import { supabase } from '@/supabase/supabaseClient'
import type { EleveDetails } from '@/lib/types'

export type InscriptionStatus =
  | 'en_attente'
  | 'valide'
  | 'rejete'
  | 'accepte'
  | 'refuse'

export interface UpdateStudentStatusDTO {
  inscriptionId: string
  status: InscriptionStatus
}

export interface UpdatedInscription {
  id: string
  status: InscriptionStatus
  updated_at: string | null
  eleve_id?: string
  classe_id?: string
}

// Typage interne précis de la réponse Supabase avec jointures
interface RawClasseRelation {
  id: string
  nom_classe: string
}

interface RawInscriptionRelation {
  id: string
  status: InscriptionStatus
  classe_id: string | null
  classes: RawClasseRelation | RawClasseRelation[] | null
}

interface RawEleveDetails extends Omit<
  EleveDetails,
  'status' | 'classe_id' | 'nom_classe' | 'inscription_id' | 'inscriptions'
> {
  inscriptions?: RawInscriptionRelation | RawInscriptionRelation[] | null
}

class StudentService {
  /**
   * Helper privé pour vérifier l'authentification et récupérer l'ID utilisateur.
   */
  private async getAuthenticatedUserId(): Promise<string> {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      throw new Error('Session invalide ou utilisateur non authentifié.')
    }
    return user.id
  }

  /**
   * Helper d'extraction sécurisée de la classe
   */
  private extractClassName(
    classes: RawClasseRelation | RawClasseRelation[] | null
  ): string {
    if (!classes) return 'Non assigné'
    if (Array.isArray(classes)) {
      return classes[0]?.nom_classe || 'Non assigné'
    }
    return classes.nom_classe || 'Non assigné'
  }

  /**
   * Récupère tous les élèves avec leurs inscriptions et classe rattachée.
   */
  async getAllStudents(): Promise<EleveDetails[]> {
    const { data, error } = await supabase
      .from('eleves_details')
      .select(
        `
        *,
        inscriptions (
          id,
          status,
          classe_id,
          classes (
            id,
            nom_classe
          )
        )
      `
      )
      .order('updatedAt', { ascending: false })

    if (error) throw new Error(`Erreur récupération élèves : ${error.message}`)

    const rawData = (data ?? []) as unknown as RawEleveDetails[]

    // Mapping sécurisé vers EleveDetails
    return rawData.map((eleve): EleveDetails => {
      const latestInscription = Array.isArray(eleve.inscriptions)
        ? eleve.inscriptions[0]
        : eleve.inscriptions

      const className = this.extractClassName(
        latestInscription?.classes ?? null
      )

      return {
        ...eleve,
        status: latestInscription?.status ?? 'en_attente',
        classe_id: latestInscription?.classe_id ?? null,
        nom_classe: className,
        inscription_id: latestInscription?.id ?? null,
      } as EleveDetails
    })
  }

  /**
   * Met à jour le statut d'inscription d'un élève.
   */
  async updateStudentStatus({
    inscriptionId,
    status,
  }: UpdateStudentStatusDTO): Promise<UpdatedInscription> {
    if (!inscriptionId || inscriptionId.trim() === '') {
      throw new Error('ID inscription requis.')
    }

    const { data, error } = await supabase
      .from('inscriptions')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inscriptionId)
      .select('id, status, updated_at, eleve_id, classe_id')
      .single()

    if (error) {
      throw new Error(
        `Erreur lors de la mise à jour du statut : ${error.message}`
      )
    }

    return data as UpdatedInscription
  }

  /**
   * Récupère tous les élèves rattachés au parent authentifié.
   */
  async getStudentsByParent(): Promise<EleveDetails[]> {
    const userId = await this.getAuthenticatedUserId()

    const { data, error } = await supabase
      .from('eleves_details')
      .select('*')
      .eq('parent_id', userId)
      .order('updatedAt', { ascending: false })

    if (error) throw new Error(`Erreur récupération élèves : ${error.message}`)
    return (data ?? []) as EleveDetails[]
  }

  /**
   * Récupère un élève spécifique par son ID (Isolé strictement par parent_id).
   */
  async getStudentById(studentId: string): Promise<EleveDetails> {
    if (!studentId || studentId.trim() === '')
      throw new Error('ID élève requis.')
    const userId = await this.getAuthenticatedUserId()

    const { data, error } = await supabase
      .from('eleves_details')
      .select('*')
      .eq('id', studentId)
      .eq('parent_id', userId)
      .single()

    if (error)
      throw new Error(
        `Élève introuvable ou accès non autorisé : ${error.message}`
      )
    return data as EleveDetails
  }

  /**
   * Enregistre un nouvel élève en liant automatiquement son parent_id.
   */
  async createStudent(
    studentData: Omit<
      EleveDetails,
      'id' | 'parent_id' | 'updatedAt' | 'createdAt'
    >
  ): Promise<EleveDetails> {
    const userId = await this.getAuthenticatedUserId()

    if (Object.keys(studentData).length === 0) {
      throw new Error('Pas de champ renseigné.')
    }

    const payload = {
      parent_id: userId,
      ...studentData,
    }

    const { data, error } = await supabase
      .from('eleves_details')
      .insert(payload)
      .select()
      .single()

    if (error)
      throw new Error(
        `Erreur lors de la création de l'élève : ${error.message}`
      )
    return data as EleveDetails
  }

  /**
   * Met à jour les informations d'un élève.
   */
  async updateStudent(
    studentId: string,
    studentData: Partial<Omit<EleveDetails, 'id' | 'parent_id'>>
  ): Promise<EleveDetails> {
    if (!studentId || studentId.trim() === '')
      throw new Error('ID élève requis.')
    const userId = await this.getAuthenticatedUserId()

    const { data, error } = await supabase
      .from('eleves_details')
      .update(studentData)
      .eq('id', studentId)
      .eq('parent_id', userId)
      .select()
      .single()

    if (error)
      throw new Error(`Erreur lors de la mise à jour : ${error.message}`)
    return data as EleveDetails
  }

  /**
   * Supprime un élève de la base de données.
   */
  async deleteStudent(studentId: string): Promise<void> {
    if (!studentId || studentId.trim() === '')
      throw new Error('ID élève requis.')
    const userId = await this.getAuthenticatedUserId()

    const { error } = await supabase
      .from('eleves_details')
      .delete()
      .eq('id', studentId)
      .eq('parent_id', userId)

    if (error)
      throw new Error(`Erreur lors de la suppression : ${error.message}`)
  }
}

export const studentService = new StudentService()
