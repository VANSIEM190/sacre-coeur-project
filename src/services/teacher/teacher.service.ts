import { supabase } from '@/supabase/supabaseClient'
import { SupabaseErrorHandler } from '../core/Supabase.error.handler'
import { authService } from '../auth/auth.service'
import type { TeacherUser } from '@/lib/types'
import { customAlphabet } from 'nanoid'

interface RegisterTeacherInput {
  fullName: string
  email: string
  assignedclasses: string[]
}

class TeacherService {
  // Étape 1 : Pré-enregistrement par l'administration
  async register(data: RegisterTeacherInput): Promise<TeacherUser> {
    try {
      const nanoid = customAlphabet(
        import.meta.env.VITE_ID_MATRICULE_TEACHER,
        5
      )
      const accessId = `SC-T-${nanoid()}`.toUpperCase()

      const { data: teacherData, error: teacherError } = await supabase
        .from('enseignants_details')
        .insert([
          {
            fullName: data.fullName,
            email: data.email,
            teacherAccessId: accessId,
            assignedclasses: data.assignedclasses,
          },
        ])
        .select()
        .single()

      if (teacherError) throw teacherError

      return {
        id: teacherData.id,
        email: teacherData.email,
        role: 'teacher',
        fullName: teacherData.fullName || data.fullName,
        teacherAccessId: teacherData.matriculeEnseignant || accessId,
        assignedclasses: teacherData.assignedclasses || [],
        createdAt: teacherData.created_at || new Date().toISOString(),
      }
    } catch (error) {
      SupabaseErrorHandler.handle(error)
      throw error
    }
  }

  async getAllTeacher(): Promise<TeacherUser[]> {
    const { data, error } = await supabase
      .from('enseignants_details')
      .select('*')
      .order('fullName', { ascending: true })

    if (error) {
      console.error('[TeacherService.getAllTeacher]:', error.message)
      throw new Error('Impossible de récupérer la liste des enseignants.')
    }

    return (data || []).map(t => ({
      id: t.id,
      email: t.email,
      role: 'teacher' as const,
      fullName: t.fullName,
      teacherAccessId: t.teacherAccessId,
      assignedclasses: t.assignedclasses || [],
      createdAt: t.created_at,
    }))
  }

  async getDetailsByEmail(email: string): Promise<TeacherUser | null> {
    const { data: teacherData, error } = await supabase
      .from('enseignants_details')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) throw error
    if (!teacherData) return null

    return {
      id: teacherData.id,
      email: teacherData.email,
      role: 'teacher',
      fullName: teacherData.fullName,
      teacherAccessId: teacherData.teacherAccessId,
      assignedclasses: teacherData.assignedclasses || [],
      createdAt: teacherData.created_at,
    }
  }

  // Étape 2 : Activation par l'enseignant lui-même
  async activateAccount(
    email: string,
    matricule: string,
    password: string
  ): Promise<void> {
    try {
      const { data: teacher, error: teacherError } = await supabase
        .from('enseignants_details')
        .select('id')
        .eq('email', email)
        .eq('teacherAccessId', matricule)
        .maybeSingle()

      if (teacherError) throw teacherError
      if (!teacher) {
        throw new Error(
          'Aucun enseignant ne correspond à cet email et ce matricule. Contactez votre administrateur.'
        )
      }

      // On délègue la création auth
      const userId = await authService.createAuthAccount(
        email,
        password,
        'teacher'
      )

      // On met à jour la table des détails de l'enseignant avec l'ID généré
      const { error: updateError } = await supabase
        .from('enseignants_details')
        .update({ user_id: userId })
        .eq('email', email)

      if (updateError) throw updateError
    } catch (error) {
      SupabaseErrorHandler.handle(error)
      throw error
    }
  }

  async updateTeacher(
    id: string,
    updates: Partial<RegisterTeacherInput>
  ): Promise<TeacherUser> {
    if (!id) {
      throw new Error(
        "Impossible de mettre à jour : id de l'enseignant manquant."
      )
    }

    const payload: Partial<
      Pick<TeacherUser, 'fullName' | 'email' | 'assignedclasses'>
    > = {}

    if (updates.fullName !== undefined) payload.fullName = updates.fullName
    if (updates.email !== undefined) payload.email = updates.email
    if (updates.assignedclasses !== undefined)
      payload.assignedclasses = updates.assignedclasses

    if (Object.keys(payload).length === 0) {
      throw new Error('Aucune modification à appliquer.')
    }

    try {
      const { data: teacherData, error } = await supabase
        .from('enseignants_details')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      if (!teacherData) throw new Error('Enseignant introuvable.')

      return {
        id: teacherData.id,
        email: teacherData.email,
        role: 'teacher',
        fullName: teacherData.fullName,
        teacherAccessId: teacherData.teacherAccessId,
        assignedclasses: teacherData.assignedclasses || [],
        createdAt: teacherData.created_at,
      }
    } catch (error) {
      SupabaseErrorHandler.handle(error)
      throw error
    }
  }

  async deleteTeacher(id: string): Promise<void> {
    if (!id) {
      throw new Error("Impossible de supprimer : id de l'enseignant manquant.")
    }
    try {
      const { data: teacher, error: fetchError } = await supabase
        .from('enseignants_details')
        .select('id, user_id')
        .eq('id', id)
        .maybeSingle()

      if (fetchError) throw fetchError
      if (!teacher) throw new Error('Enseignant introuvable.')

      if (teacher.user_id) {
        await authService.deleteAccount(teacher.user_id)
      }

      const { error: deleteError } = await supabase
        .from('enseignants_details')
        .delete()
        .eq('id', id)
      if (deleteError) throw deleteError
    } catch (error) {
      SupabaseErrorHandler.handle(error)
      throw error
    }
  }
}

export const teacherService = new TeacherService()
