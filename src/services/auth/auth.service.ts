import { supabase } from '@/supabase/supabaseClient'
import { SupabaseErrorHandler } from '../core/Supabase.error.handler'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'teacher' | 'parent'

export interface LoginResponse {
  user: User
  role: UserRole
}

class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        })

      if (authError) throw authError
      if (!authData.user)
        throw new Error('Impossible de récupérer les données utilisateur.')

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .maybeSingle()

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

  // Étape de sécurité commune à toutes les créations de compte
  async createAuthAccount(
    email: string,
    password: string,
    role: UserRole
  ): Promise<string> {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email,
        password,
        options: { data: { role } },
      }
    )

    if (signUpError) throw signUpError
    if (!signUpData.user)
      throw new Error('Erreur lors de la création du compte de sécurité.')

    const { error: profileError } = await supabase.from('profiles').insert({
      id: signUpData.user.id,
      email: email,
      role: role,
    })

    if (profileError) throw profileError

    return signUpData.user.id
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

// Nom au singulier et export propre
export const authService = new AuthService()
