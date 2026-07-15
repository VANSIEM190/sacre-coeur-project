// @/services/studentService.ts
import { supabase } from '@/supabase/supabaseClient'
import type { StudentUser } from '@/lib/types'
import { getCurrentSchoolYear } from '@/utils/getCurrentSchoolYear'

class StudentServices {
  // Récupérer les enfants liés au parent connecté
  async getStudentsByParent(): Promise<StudentUser[]> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Utilisateur non authentifié')

    const { data, error } = await supabase
      .from('eleves_details')
      .select('*')
      .eq('parent_id', user.id) // Sécurité : On ne récupère QUE ses propres enfants
      .order('updatedAt', { ascending: false })

    if (error) throw error
    return data || []
  }
  async getAllStudents(): Promise<StudentUser[]> {
    const { data, error } = await supabase
      .from('eleves_details')
      .select('*')
      .order('updatedAt', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getPendingStudents(): Promise<StudentUser[]> {
    const { data, error } = await supabase
      .from('eleves_details')
      .select('*')
      .eq('status', 'en_attente')
      .order('updatedAt', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Création d'un enfant
  async createStudent(
    values: Omit<
      StudentUser,
      'id' | 'status' | 'classe_id' | 'parent_id' | 'anneeScolaire'
    >
  ): Promise<StudentUser> {
    if (Object.keys(values).length === 0) {
      throw new Error('Aucune donnée renseignée')
    }

    // Sécurité : Récupération de la session utilisateur côté Supabase (Inviolable)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Session parent introuvable')

    const { data, error } = await supabase
      .from('eleves_details')
      .insert({
        ...values,
        parent_id: user.id, // Injecté de force de manière sécurisée
        anneeScolaire: getCurrentSchoolYear(), // Injecté automatiquement (Kinshasa)
        classe_id: values.currentClassName,
        status: 'en_attente', // Statut initial par défaut
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Modification d'un enfant
  async updateStudent(
    id: string,
    values: Partial<Omit<StudentUser, 'id' | 'parent_id' | 'anneeScolaire'>>
  ): Promise<StudentUser> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Utilisateur non authentifié')

    const { data, error } = await supabase
      .from('eleves_details')
      .update({
        ...values,
        classe_id: values.currentClassName,
      })
      .eq('id', id)
      .eq('parent_id', user.id) // Sécurité : Empêche de modifier l'enfant d'un autre parent
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateStudentStatus(
    id: string,
    status: 'valide' | 'rejete'
  ): Promise<StudentUser> {
    // Sécurité supplémentaire : Vérification de session active côté client avant la requête
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user)
      throw new Error('Action non autorisée : session introuvable')

    const { data, error } = await supabase
      .from('eleves_details')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Suppression d'un enfant
  async deleteStudent(id: string): Promise<void> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Utilisateur non authentifié')

    const { error } = await supabase
      .from('eleves_details')
      .delete()
      .eq('id', id)
      .eq('parent_id', user.id) // Sécurité : Empêche de supprimer l'enfant d'un autre parent

    if (error) throw error
  }
}

export const studentService = new StudentServices()
