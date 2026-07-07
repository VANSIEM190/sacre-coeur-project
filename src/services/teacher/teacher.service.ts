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
        10
      )
      const accessId = nanoid()

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

  async getDetailsByEmail(email: string): Promise<TeacherUser> {
    const { data, error } = await supabase
      .from('archives')
      .select('*')
      .eq('email', email)
      .single()

    if (error) throw error
    return data || []
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
        .eq('matriculeEnseignant', matricule)
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
        .update({ id: userId })
        .eq('email', email)

      if (updateError) throw updateError
    } catch (error) {
      SupabaseErrorHandler.handle(error)
      throw error
    }
  }
}

export const teacherService = new TeacherService()
