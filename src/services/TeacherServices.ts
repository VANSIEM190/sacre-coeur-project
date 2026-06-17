// @/services/TeacherServices.ts
import { supabase } from '@/supabase/supabaseClient'
import type { TeacherUser } from '@/lib/types'

interface RegisterTeacherInput {
  fullName: string
  email: string
  assignedClassIds: string[]
}

class TeacherServices {
  generateAccessId() {
    const year = new Date().getFullYear()
    const randomDigits = Math.floor(1000 + Math.random() * 9000)
    return `SC-T-${year}-${randomDigits}`
  }

  async register(data: RegisterTeacherInput): Promise<TeacherUser> {
    const accessId = this.generateAccessId()

    //  On enregistre les identifiants bruts (IDs) dans la colonne correspondante
    const { data: teacherData, error: teacherError } = await supabase
      .from('enseignants_details')
      .insert([
        {
          fullName: data.fullName,
          email: data.email,
          matriculeEnseignant: accessId,
          assignedclasses: data.assignedClassIds,
        },
      ])
      .select()
      .single()

    if (teacherError) {
      throw new Error(teacherError.message)
    }

    return {
      id: teacherData.id,
      email: teacherData.email,
      role: 'teacher',
      fullName: teacherData.fullName || data.fullName,
      teacherAccessId: teacherData.matriculeEnseignant || accessId,
      assignedClassNames: teacherData.assignedclasses || [],
      createdAt: teacherData.created_at || new Date().toISOString(),
    }
  }
}

export const teacherServices = new TeacherServices()
