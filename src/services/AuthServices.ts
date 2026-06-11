import { supabase } from '@/supabase/supabaseClient'
import { SupabaseErrorHandler } from './SupabaseErrorHandler'

export type UserRole = 'admin' | 'teacher' | 'student'

export interface LoginResponse {
  user: any
  role: UserRole
}

class AuthServices {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        })

      if (authError) throw authError
      if (!authData.user)
        throw new Error('Impossible de récupérer les données utilisateur.')

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single()

      if (profileError) throw profileError
      if (!profileData) throw new Error('Aucun profil associé à ce compte.')

      return {
        user: authData.user,
        role: profileData.role as UserRole,
      }
    } catch (error) {
      SupabaseErrorHandler.handle(error)
      throw error
    }
  }

  async activateTeacherAccount(
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

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: 'teacher',
            },
          },
        })

      if (signUpError) throw signUpError
      if (!signUpData.user)
        throw new Error('Erreur lors de la création du compte de sécurité.')

      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: signUpData.user.id,
          email: email,
          role: 'teacher',
        },
      ])

      if (profileError) throw profileError

      const { error: updateError } = await supabase
        .from('enseignants_details')
        .update({ id: signUpData.user.id })
        .eq('email', email)

      if (updateError) throw updateError
    } catch (error) {
      SupabaseErrorHandler.handle(error)
      throw error
    }
  }

  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      SupabaseErrorHandler.handle(error)
      throw error
    }
  }

  async getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  }
}

export const authServices = new AuthServices()
