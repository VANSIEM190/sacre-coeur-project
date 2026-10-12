
import { supabase } from '../../supabase/supabaseClient'
import { authService } from '../auth/auth.service'
import { DomainError } from '@sacre-coeur/domain/errors'
import { parentSchema } from '@sacre-coeur/domain/validators/usersSchema'

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
    const validation = parentSchema.safeParse({ ...values, middleName: values.middleName ?? '' })
    if (!validation.success) throw new DomainError(validation.error.issues[0]?.message ?? 'Informations parent invalides.')
    const parent = validation.data
    const userId = await authService.createAuthAccount(parent.email, parent.password, 'parent')
    const { error } = await supabase.from('parents').insert({
      id: userId, lastName: parent.lastName, middleName: parent.middleName || null,
      firstName: parent.firstName, profession: parent.profession, guardianRelation: parent.guardianRelation, phone: parent.phone,
    })
    if (error) {
      throw new DomainError("Le compte a été créé, mais les informations du parent n'ont pas pu être enregistrées. Contactez l'administration avant de réessayer.", { cause: error })
    }
  }
}

export const parentService = new ParentService()
