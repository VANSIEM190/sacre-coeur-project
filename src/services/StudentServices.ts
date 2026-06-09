// @/services/studentService.ts (ou ton chemin actuel)
import { supabase } from '@/supabase/supabaseClient'
import { SupabaseErrorHandler } from './SupabaseErrorHandler'
import type { SchoolClassName } from '@/lib/types'

class StudentServices {
  async register(values: any) {
    try {
      console.log('Données envoyées à Supabase Auth :', {
        email: values.email,
        password: values.password,
      })
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { data: { role: 'student' } },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error("Erreur d'authentification")

      const { error: detailsError } = await supabase
        .from('eleves_details')
        .insert([
          {
            id: authData.user.id,
            lastName: values.lastName,
            middleName: values.middleName || null,
            firstName: values.firstName,
            birthDate: values.birthDate,
            birthPlace: values.birthPlace,
            gender: values.gender,
            fatherName: values.fatherName,
            motherName: values.motherName,
            fatherProfession: values.fatherProfession,
            motherProfession: values.motherProfession,
            childMedicalCondition: values.childMedicalCondition || null,
            guardianRelation: values.guardianRelation,
            phone: values.phone,
            previousSchoolPercentage: values.previousSchoolPercentage,
            currentClassName: values.currentClassName as SchoolClassName,
            previousSchoolName: values.previousSchoolName,
            religion: values.religion,
            address: values.address,
            province: values.province,
          },
        ])

      if (detailsError) throw detailsError

      return authData.user
    } catch (error: unknown) {
      SupabaseErrorHandler.handle(error)
    }
  }
}

export const studentService = new StudentServices()
