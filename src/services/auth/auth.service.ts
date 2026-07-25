// @/services/auth/auth.service.ts
import { supabase } from '@/supabase/supabaseClient'
import { SupabaseErrorHandler } from '../core/Supabase.error.handler'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'teacher' | 'parent'

const ROLES: readonly UserRole[] = ['admin', 'teacher', 'parent'] as const

// Rôles qu'un utilisateur peut s'auto-attribuer à l'inscription.
// 'teacher' et 'admin' NE DOIVENT JAMAIS figurer ici : leur attribution
// doit obligatoirement passer par un flux serveur (Edge Function avec
// clé service_role appelée par un admin authentifié, ou système
// d'invitation à token unique validé côté serveur).
const SELF_ASSIGNABLE_ROLES: readonly UserRole[] = ['parent'] as const

function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === 'string' && (ROLES as readonly string[]).includes(value)
  )
}

export interface LoginResponse {
  user: User
  role: UserRole
}

// Message générique utilisé pour TOUTE erreur d'authentification
// (mauvais mot de passe, profil absent, rôle incorrect, etc.).
// Ne jamais révéler LEQUEL de ces cas s'est produit : un attaquant
// pourrait sinon déduire si un email existe et quel rôle il possède
// (énumération de comptes).
const GENERIC_AUTH_ERROR =
  'Identifiants invalides ou compte non autorisé pour cet accès.'

class AuthService {
  async login(
    email: string,
    password: string,
    expectedRole: UserRole
  ): Promise<LoginResponse> {
    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password })

      if (authError || !authData.user) {
        throw new Error(GENERIC_AUTH_ERROR, { cause: authError })
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .maybeSingle()

      // Sécurité : on valide la forme réelle de la donnée avant de lui
      // faire confiance, au lieu d'un simple cast `as UserRole`.
      if (profileError || !profileData || !isUserRole(profileData.role)) {
        await this.safeLogout()
        console.error(
          '[auth] Échec de récupération du profil :',
          profileError ?? 'profil introuvable ou rôle invalide'
        )
        throw new Error(GENERIC_AUTH_ERROR, { cause: profileError })
      }

      const userRole = profileData.role

      if (userRole !== expectedRole) {
        await this.safeLogout()
        // Même message générique : ne jamais confirmer que le compte
        // existe avec un autre rôle.
        throw new Error(GENERIC_AUTH_ERROR)
      }

      return { user: authData.user, role: userRole }
    } catch (error) {
      if (error instanceof Error && error.message === GENERIC_AUTH_ERROR) {
        throw error
      }
      const message = SupabaseErrorHandler.handle(error)
      throw new Error(message, { cause: error })
    }
  }

  /**
   * Crée un compte avec un rôle AUTO-ATTRIBUABLE uniquement
   * ('student' ou 'parent').
   *
   * IMPORTANT : cette méthode ne doit jamais servir à créer des comptes
   * 'teacher' ou 'admin'. Ce fichier s'exécute côté client : rien
   * n'empêche un attaquant d'appeler directement
   * `supabase.auth.signUp(...)` en contournant entièrement ce service.
   * La vraie barrière de sécurité DOIT se trouver dans les policies RLS
   * de la table `profiles` (voir explication fournie séparément), pas
   * dans ce code.
   */
  async createAuthAccount(
    email: string,
    password: string,
    role: UserRole
  ): Promise<string> {
    try {
      if (!SELF_ASSIGNABLE_ROLES.includes(role)) {
        throw new Error(
          'Ce rôle ne peut pas être créé directement. Contactez un administrateur.'
        )
      }

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: { data: { role } },
        })

      if (signUpError) throw signUpError
      if (!signUpData.user) {
        throw new Error('Erreur lors de la création du compte.')
      }

      const { error: profileError } = await supabase.from('profiles').insert({
        id: signUpData.user.id,
        email,
        role,
      })

      if (profileError) {
        // Le compte Auth existe mais le profil n'a pas pu être créé :
        // idéalement, cette insertion devrait être faite par un trigger
        // Postgres `on_auth_user_created` (SECURITY DEFINER) pour
        // garantir l'atomicité entre auth.users et profiles, plutôt
        // que par deux appels séparés depuis le client.
        throw profileError
      }

      return signUpData.user.id
    } catch (error) {
      const message = SupabaseErrorHandler.handle(error)
      throw new Error(message, { cause: error })
    }
  }

  /**
   * Ré-authentifie l'utilisateur avec son mot de passe actuel.
   * À appeler AVANT toute opération sensible (changement d'email,
   * de mot de passe, suppression de compte), pour qu'une session déjà
   * ouverte (poste partagé, token volé encore valide...) ne suffise
   * pas à elle seule à modifier le compte.
   */
  private async reauthenticate(currentPassword: string): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user?.email) {
      throw new Error('Session invalide, veuillez vous reconnecter.')
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (error) {
      throw new Error('Mot de passe actuel incorrect.')
    }
  }

  /**
   * Met à jour l'adresse e-mail de l'utilisateur connecté.
   * Nécessite le mot de passe actuel (opération sensible).
   */
  async updateEmail(newEmail: string, currentPassword: string): Promise<void> {
    try {
      await this.reauthenticate(currentPassword)
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw error
    } catch (error) {
      const message = SupabaseErrorHandler.handle(error)
      throw new Error(message, { cause: error })
    }
  }

  /**
   * Met à jour le mot de passe de l'utilisateur connecté.
   * Nécessite le mot de passe actuel (opération sensible).
   */
  async updatePassword(
    newPassword: string,
    currentPassword: string
  ): Promise<void> {
    try {
      await this.reauthenticate(currentPassword)
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (error) throw error
    } catch (error) {
      const message = SupabaseErrorHandler.handle(error)
      throw new Error(message, { cause: error })
    }
  }

  /**
   * Déconnexion complète.
   */
  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      const message = SupabaseErrorHandler.handle(error)
      throw new Error(message, { cause: error })
    }
  }

  /**
   * Variante interne utilisée dans les chemins d'erreur de `login`.
   * Ne doit jamais lever d'exception : sinon elle masquerait l'erreur
   * d'authentification originale déjà en cours de traitement.
   */
  private async safeLogout(): Promise<void> {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('[auth] Erreur lors de la déconnexion de sécurité :', error)
    }
  }

  /**
   * Supprime le compte utilisateur (RPC) et clôture la session.
   * Nécessite le mot de passe actuel (opération irréversible).
   */
  async deleteAccount(currentPassword: string): Promise<void> {
    try {
      await this.reauthenticate(currentPassword)
      const { error } = await supabase.rpc('delete_user_account')
      if (error) throw error
      await this.logout()
    } catch (error) {
      const message = SupabaseErrorHandler.handle(error)
      throw new Error(message, { cause: error })
    }
  }

  /**
   * Récupère l'utilisateur Supabase actuel.
   */
  async getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  }
}

export const authService = new AuthService()
