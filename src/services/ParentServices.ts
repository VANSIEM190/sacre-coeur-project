// @/services/studentService.ts
import { supabase } from '@/supabase/supabaseClient'
import { SupabaseErrorHandler } from './SupabaseErrorHandler'

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

class ParentServices {
  async register(values: RegisterParentInput) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { role: 'parent' },
        },
      })

      if (authError) throw authError
      if (!authData.user)
        throw new Error('Échec de la création du compte utilisateur.')

      const userId = authData.user.id

      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        email: values.email,
        role: 'parent',
      })

      if (profileError) throw profileError

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

      return authData.user
    } catch (error: unknown) {
      SupabaseErrorHandler.handle(error)
      throw error
    }
  }
}

export const parentService = new ParentServices()
