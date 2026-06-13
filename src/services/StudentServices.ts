// @/services/studentService.ts
import { supabase } from '@/supabase/supabaseClient'
import { SupabaseErrorHandler } from './SupabaseErrorHandler'
import type { SchoolClassName } from '@/lib/types'

export interface RegisterStudentInput {
  email: string
  password: string // Obligatoire pour l'inscription !
  lastName: string
  middleName?: string | null
  firstName: string
  birthDate: string
  birthPlace: string
  gender: 'M' | 'F'
  fatherName: string
  motherName: string
  fatherProfession: string
  motherProfession: string
  childMedicalCondition?: string | null
  guardianRelation: string
  phone: string
  previousSchoolPercentage: number
  currentClassName: SchoolClassName
  previousSchoolName: string
  religion: string
  address: string
  province: string
}

class StudentServices {
  async register(values: RegisterStudentInput) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { role: 'student' },
        },
      })

      if (authError) throw authError
      if (!authData.user)
        throw new Error('Échec de la création du compte utilisateur.')

      const userId = authData.user.id

      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        email: values.email,
        role: 'student',
      })

      if (profileError) throw profileError

      const { error: detailsError } = await supabase
        .from('eleves_details')
        .insert({
          id: userId,
          lastName: values.lastName,
          middleName: values.middleName ?? null,
          firstName: values.firstName,
          birthDate: values.birthDate,
          birthPlace: values.birthPlace,
          gender: values.gender,
          fatherName: values.fatherName,
          motherName: values.motherName,
          fatherProfession: values.fatherProfession,
          motherProfession: values.motherProfession,
          childMedicalCondition: values.childMedicalCondition ?? null,
          guardianRelation: values.guardianRelation,
          phone: values.phone,
          previousSchoolPercentage: values.previousSchoolPercentage,
          currentClassName: values.currentClassName,
          previousSchoolName: values.previousSchoolName,
          religion: values.religion,
          address: values.address,
          province: values.province,
        })

      if (detailsError) throw detailsError

      return authData.user
    } catch (error: unknown) {
      SupabaseErrorHandler.handle(error)
      throw error
    }
  }
}

export const studentService = new StudentServices()
