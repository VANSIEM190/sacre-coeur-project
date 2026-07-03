import { supabase } from '@/supabase/supabaseClient'
import { SupabaseErrorHandler } from '../core/Supabase.error.handler'
import { authService } from '../auth/auth.service'

export interface RegisterParentInput {
  email: string
  password: string
  lastName: string
  middleName?: string | null
  firstName: string
  guardianRelation: string
  profession: string
  phone: string
}

class ParentService {
  async register(values: RegisterParentInput): Promise<void> {
    try {
      // 1. Délégation de la création de compte au service d'authentification
      const userId = await authService.createAuthAccount(
        values.email,
        values.password,
        'parent'
      )

      // 2. Insertion spécifique aux attributs du parent
      const { error: detailsError } = await supabase.from('parents').insert({
        id: userId,
        lastName: values.lastName,
        middleName: values.middleName ?? null,
        firstName: values.firstName,
        profession: values.profession,
        guardianRelation: values.guardianRelation,
        phone: values.phone,
      })

      if (detailsError) throw detailsError
    } catch (error) {
      SupabaseErrorHandler.handle(error)
      throw error
    }
  }
}

export const parentService = new ParentService()
