
import type { TeacherUser } from '@sacre-coeur/domain/types'
import { createTeacherSchema, parseAssignedClassIds, type RegisterTeacherInput } from '@sacre-coeur/domain/teachers'
import { DomainError } from '@sacre-coeur/domain/errors'
import { requireText, requireUuid } from '@sacre-coeur/domain/validation'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../../supabase/supabaseClient'

export type { RegisterTeacherInput } from '@sacre-coeur/domain/teachers'

interface TeacherRow {
  id: string
  fullName: string
  email: string
  teacherAccessId: string
  assignedclasses: string | string[] | null
  created_at: string
}

function mapTeacher(row: TeacherRow): TeacherUser {
  return { id: row.id, fullName: row.fullName, email: row.email, teacherAccessId: row.teacherAccessId,
    assignedclasses: parseAssignedClassIds(row.assignedclasses), role: 'teacher', createdAt: row.created_at }
}

async function invokeTeacherAccounts<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>('teacher-accounts', { body })
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const response = await error.context.json().catch(() => null) as { error?: string } | null
      if (response?.error) throw new DomainError(response.error, { cause: error })
    }
    throw new DomainError("Impossible d'effectuer cette opération. Vérifiez que la fonction teacher-accounts est déployée.", { cause: error })
  }
  if (!data) throw new DomainError("Le serveur n'a pas retourné de résultat.")
  return data
}

class TeacherService {
  /** Création Auth et invitation exécutées côté serveur avec contrôle du rôle admin. */
  async register(values: RegisterTeacherInput): Promise<TeacherUser> {
    const validated = createTeacherSchema.safeParse(values)
    if (!validated.success) throw new DomainError(validated.error.issues[0]?.message ?? 'Informations enseignant invalides.')
    const result = await invokeTeacherAccounts<{ teacher: TeacherUser }>({ action: 'create', ...validated.data })
    return result.teacher
  }

  async inviteTeacher(id: string): Promise<TeacherUser> {
    requireUuid(id, "Identifiant de l'enseignant")
    const result = await invokeTeacherAccounts<{ teacher: TeacherUser }>({ action: 'invite', id })
    return result.teacher
  }

  async getAllTeacher(): Promise<TeacherUser[]> {
    const { data, error } = await supabase.from('enseignants_details').select('*').order('fullName', { ascending: true })
    if (error) throw error
    return (data ?? []).map(mapTeacher)
  }

  async getDetailsByEmail(email: string): Promise<TeacherUser | null> {
    const { data, error } = await supabase.from('enseignants_details').select('*').eq('email', email.trim()).maybeSingle()
    if (error) throw error
    return data ? mapTeacher(data) : null
  }

  async getDetailsByUserId(userId: string): Promise<TeacherUser | null> {
    requireUuid(userId, "Identifiant de l'utilisateur")
    const { data, error } = await supabase.from('enseignants_details').select('*').eq('user_id', userId).maybeSingle()
    if (error) throw error
    return data ? mapTeacher(data) : null
  }

  async updateTeacher(id: string, updates: Partial<RegisterTeacherInput>): Promise<TeacherUser> {
    requireUuid(id, "Identifiant de l'enseignant")
    const payload: { fullName?: string; email?: string } = {}
    let updatedTeacher: TeacherUser | undefined
    if (updates.fullName !== undefined) payload.fullName = requireText(updates.fullName, 'Nom complet')
    if (updates.email !== undefined) {
      // Auth email et détails doivent rester cohérents : l'email lié change depuis le compte enseignant.
      const { data: linkedTeacher, error: fetchError } = await supabase.from('enseignants_details').select('user_id,email').eq('id', id).single()
      if (fetchError) throw fetchError
      if (linkedTeacher.user_id && linkedTeacher.email !== updates.email.trim()) {
        throw new DomainError("Un enseignant activé doit modifier son email depuis les paramètres de son compte.")
      }
      payload.email = requireText(updates.email, 'Email')
    }
    if (updates.assignedclasses !== undefined) {
      for (const classId of updates.assignedclasses) requireUuid(classId, 'Identifiant de classe')
      const classIds = [...new Set(updates.assignedclasses)]
      const result = await invokeTeacherAccounts<{ teacher: TeacherUser }>({ action: 'assign-classes', id, assignedclasses: classIds })
      updatedTeacher = result.teacher
    }
    if (!Object.keys(payload).length && updatedTeacher) return updatedTeacher
    if (!Object.keys(payload).length) throw new DomainError('Aucune modification à appliquer.')
    const { data, error } = await supabase.from('enseignants_details').update(payload).eq('id', id).select().single()
    if (error) throw error
    return mapTeacher(data)
  }

  async deleteTeacher(id: string): Promise<void> {
    requireUuid(id, "Identifiant de l'enseignant")
    await invokeTeacherAccounts<{ success: boolean }>({ action: 'delete', id })
  }
}

export const teacherService = new TeacherService()
