import { AuthSessionMissingError, FunctionsHttpError, type User } from '@supabase/supabase-js'
import { DomainError } from '@sacre-coeur/domain/errors'
import type { AnyUser, ParentUser, UserRole } from '@sacre-coeur/domain/types'
import { supabase } from '../../supabase/supabaseClient'
import { getErrorMessage } from '../core/Supabase.error.handler'
import { teacherService } from '../teacher/teacher.service'

export type { UserRole } from '@sacre-coeur/domain/types'

const ROLES: readonly UserRole[] = ['admin', 'teacher', 'parent']
const GENERIC_AUTH_ERROR = 'Identifiants invalides ou compte non autorisé pour cet accès.'

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && ROLES.some(role => role === value)
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

export interface LoginResponse {
  user: AnyUser
  role: UserRole
}

class AuthService {
  private async getRole(userId: string): Promise<UserRole> {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (error || !data || !isUserRole(data.role)) {
      throw new DomainError(GENERIC_AUTH_ERROR, { cause: error })
    }
    return data.role
  }

  private async toApplicationUser(user: User, role: UserRole): Promise<AnyUser> {
    const base = {
      id: user.id,
      email: user.email ?? '',
      fullName: optionalString(user.user_metadata?.fullName) ?? user.email?.split('@')[0] ?? '',
      createdAt: user.created_at,
    }

    if (role === 'admin') return { ...base, role }

    if (role === 'teacher') {
      const details = await teacherService.getDetailsByUserId(user.id)
      if (!details) {
        throw new DomainError('Votre dossier enseignant est indisponible. Contactez la direction.')
      }
      return {
        ...base,
        role,
        fullName: details.fullName || base.fullName,
        assignedclasses: details.assignedclasses,
      }
    }

    const { data, error } = await supabase
      .from('parents')
      .select('lastName,middleName,firstName,profession,guardianRelation,phone')
      .eq('id', user.id)
      .maybeSingle()
    if (error) throw new DomainError(getErrorMessage(error), { cause: error })

    const parent: ParentUser = {
      ...base,
      role,
      lastName: optionalString(data?.lastName),
      middleName: optionalString(data?.middleName),
      firstName: optionalString(data?.firstName),
      profession: optionalString(data?.profession),
      guardianRelation: optionalString(data?.guardianRelation),
      phone: optionalString(data?.phone),
    }
    parent.fullName = [parent.firstName, parent.middleName, parent.lastName]
      .filter(Boolean).join(' ') || base.fullName
    return parent
  }

  async login(email: string, password: string, expectedRole: UserRole): Promise<LoginResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      throw new DomainError(GENERIC_AUTH_ERROR, { cause: error })
    }

    try {
      const role = await this.getRole(data.user.id)
      if (role !== expectedRole) throw new DomainError(GENERIC_AUTH_ERROR)
      return { user: await this.toApplicationUser(data.user, role), role }
    } catch (error) {
      // A password match alone never authorizes an application role.
      await supabase.auth.signOut({ scope: 'local' })
      throw new DomainError(getErrorMessage(error), { cause: error })
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const { data, error } = await supabase.auth.getUser()
    if (error instanceof AuthSessionMissingError) return null
    if (error) throw new DomainError(getErrorMessage(error), { cause: error })
    return data.user
  }

  async getAuthenticatedUser(): Promise<AnyUser | null> {
    const user = await this.getCurrentUser()
    if (!user) return null
    return this.toApplicationUser(user, await this.getRole(user.id))
  }

  async activateTeacher(teacherAccessId: string, password: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke<{
      success: boolean
      email: string
      error?: string
    }>('teacher-enrollment', { body: { teacherAccessId, password } })

    if (error) {
      if (error instanceof FunctionsHttpError) {
        const response = await error.context.json().catch(() => null) as { error?: string } | null
        if (response?.error) throw new DomainError(response.error, { cause: error })
      }
      throw new DomainError('Impossible d’activer ce compte enseignant.', { cause: error })
    }
    if (!data?.success || !data.email)
      throw new DomainError(data?.error ?? 'Réponse invalide du serveur d’activation.')
    return data.email
  }

  // Parents self-register directly. Teacher activation is handled by a server
  // function that verifies the one-time matricule before creating an Auth user.
  async createAuthAccount(email: string, password: string, role: UserRole): Promise<string> {
    if (role !== 'parent') {
      throw new DomainError('Ce rôle doit être créé par un administrateur.')
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },
    })
    if (error) throw new DomainError(getErrorMessage(error), { cause: error })
    if (!data.user) throw new DomainError('Le compte n’a pas pu être créé.')

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      email,
      role,
    })
    if (profileError) {
      throw new DomainError(
        'Le compte de connexion a été créé, mais son profil n’a pas pu être enregistré. Contactez la direction avant de recommencer.',
        { cause: profileError },
      )
    }
    return data.user.id
  }

  private async reauthenticate(currentPassword: string): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user?.email) throw new DomainError('Session invalide, veuillez vous reconnecter.')
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (error) throw new DomainError('Mot de passe actuel incorrect.', { cause: error })
  }

  async updateEmail(newEmail: string, currentPassword: string): Promise<void> {
    await this.reauthenticate(currentPassword)
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) throw new DomainError(getErrorMessage(error), { cause: error })
  }

  async updatePassword(newPassword: string, currentPassword: string): Promise<void> {
    await this.reauthenticate(currentPassword)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new DomainError(getErrorMessage(error), { cause: error })
  }

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) throw new DomainError(getErrorMessage(error), { cause: error })
  }

  async deleteAccount(currentPassword: string): Promise<void> {
    await this.reauthenticate(currentPassword)
    const { error } = await supabase.rpc('delete_user_account')
    if (error) throw new DomainError(getErrorMessage(error), { cause: error })
    await this.logout()
  }
}

export const authService = new AuthService()
