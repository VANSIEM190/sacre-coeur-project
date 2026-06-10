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
