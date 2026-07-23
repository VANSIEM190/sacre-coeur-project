import { supabase } from '@/supabase/supabaseClient'
import type { EleveDetails } from '@/lib/types'

class StudentService {
  /**
   * Helper privé pour vérifier l'authentification et récupérer l'ID utilisateur.
   * Évite la duplication de code et garantit la présence d'une session valide.
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
   * Récupère tous les élèves rattachés au parent authentifié.
   */
  async getStudentsByParent(): Promise<EleveDetails[]> {
    const userId = await this.getAuthenticatedUserId()

    const { data, error } = await supabase
      .from('eleves_details')
      .select('*')
      .eq('parent_id', userId)
      .order('updatedAt', { ascending: false }) // Correction : updatedAt au lieu de updated_at

    if (error) throw new Error(`Erreur récupération élèves : ${error.message}`)
    return data || []
  }

  /**
   * Récupère un élève spécifique par son ID (Isolé strictement par parent_id).
   */
  async getStudentById(studentId: string): Promise<EleveDetails> {
    if (!studentId) throw new Error('ID élève requis.')
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
    return data
  }

  /**
   * Enregistre un nouvel élève en liant automatiquement son parent_id.
   */
  // Dans StudentService.ts

  async createStudent(
    studentData: Omit<
      EleveDetails,
      'id' | 'parent_id' | 'updatedAt' | 'createdAt'
    >
  ): Promise<EleveDetails> {
    const userId = await this.getAuthenticatedUserId()

    // On extrait anneeScolaire pour ne pas l'envoyer dans eleves_details
    const { anneeScolaire, ...payloadData } = studentData as any

    const payload = {
      ...payloadData,
      parent_id: userId,
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
    return data
  }

  /**
   * Met à jour les informations d'un élève.
   */
  async updateStudent(
    studentId: string,
    studentData: Partial<Omit<EleveDetails, 'id' | 'parent_id'>>
  ): Promise<EleveDetails> {
    if (!studentId) throw new Error('ID élève requis.')
    const userId = await this.getAuthenticatedUserId()

    const { data, error } = await supabase
      .from('eleves_details')
      .update(studentData)
      .eq('id', studentId)
      .eq('parent_id', userId) // RLS de sécurité au niveau applicatif
      .select()
      .single()

    if (error)
      throw new Error(`Erreur lors de la mise à jour : ${error.message}`)
    return data
  }

  /**
   * Supprime un élève de la base de données.
   */
  async deleteStudent(studentId: string): Promise<void> {
    if (!studentId) throw new Error('ID élève requis.')
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
