// @/services/auth/auth.service.ts
import { supabase } from '@/supabase/supabaseClient'
import { SupabaseErrorHandler } from '../core/Supabase.error.handler'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'teacher' | 'parent' | 'student'

export interface LoginResponse {
  user: User
  role: UserRole
}

class AuthService {
  async login(
    email: string,
    password: string,
    expectedRole: UserRole
  ): Promise<LoginResponse> {
    try {
      // 1. Connexion initiale via Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        })

      if (authError) throw authError
      if (!authData.user)
        throw new Error('Impossible de récupérer les données utilisateur.')

      // 2. Récupération sécurisée du profil utilisateur en base de données
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .maybeSingle()

      if (profileError) {
        await this.logout() // Déconnexion préventive en cas d'erreur de récupération du profil
        throw profileError
      }

      if (!profileData) {
        await this.logout() // Déconnexion immédiate s'il n'y a aucun profil associé
        throw new Error('Aucun profil associé à ce compte.')
      }

      const userRole = profileData.role as UserRole

      // 3. Sécurité Critique : Validation de la cohérence du rôle demandé
      if (userRole !== expectedRole) {
        await this.logout() // Déconnexion immédiate et destruction de la session Supabase
        const readableRole =
          expectedRole === 'parent'
            ? 'parent'
            : expectedRole === 'teacher'
              ? 'enseignant'
              : 'administrateur'
        throw new Error(
          `Ce compte n'est pas enregistré en tant qu'${readableRole}.`
        )
      }

      return {
        user: authData.user,
        role: userRole,
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
    // Sécurité : Interdiction absolue d'auto-créer un rôle d'administration côté client
    if (role === 'admin') {
      throw new Error(
        'Action non autorisée : Vous ne pouvez pas créer de compte administrateur par cette voie.'
      )
    }

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

export const authService = new AuthService()
