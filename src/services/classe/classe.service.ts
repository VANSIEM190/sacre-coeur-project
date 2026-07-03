import { supabase } from '@/supabase/supabaseClient'
import type { ClassName, StudentUser } from '@/lib/types'

interface SupabaseClassResponse {
  id: string
  nom_classe: string
  annee_scolaire: string
  eleves_details: { id: string }[] | null
}

interface SupabaseTeacherLinkResponse {
  id: string
  enseignant_id: string
  classe_id: string
  matiere: string | null
  created_at?: string
}

export interface StudentClassList {
  id: string
  lastName: string
  firstName: string
  middleName: string
  email: string
}

class ClassService {
  async getAllClasses(): Promise<ClassName[]> {
    const { data: getData, error: getError } = await supabase
      .from('classes')
      .select('*,eleves_details(id)')
      .order('nom_classe', { ascending: true })

    if (getError) throw getError
    if (!getData) return []

    const classes = getData as unknown as SupabaseClassResponse[]

    return classes.map(classe => ({
      id: classe.id,
      nom_classe: classe.nom_classe,
      annee_scolaire: classe.annee_scolaire,
      studentCount: classe.eleves_details?.length || 0,
    }))
  }

  async getStudentsInClass(classId: string): Promise<StudentUser[]> {
    const { data, error } = await supabase
      .from('eleves_details')
      .select('*')
      .eq('classe_id', classId)
      .order('lastName', { ascending: true })

    if (error) throw error
    if (!data) return []

    const rawStudents = data as StudentUser[]

    return rawStudents
  }

  async createClass(
    nomClasse: string,
    anneeScolaire: string
  ): Promise<Omit<ClassName, 'studentCount'>> {
    const nomNettoye = nomClasse.trim()

    const { data: createData, error: createError } = await supabase
      .from('classes')
      .insert([
        {
          nom_classe: nomClasse,
          annee_scolaire: anneeScolaire,
        },
      ])
      .select()
      .single()

    if (createError) {
      if (createError.code === '23505') {
        throw new Error(
          `La classe "${nomNettoye}" existe déjà pour cette année scolaire.`
        )
      }

      throw createError
    }
    if (!createData)
      throw new Error('Aucune donnée renvoyée après la création.')

    return createData as Omit<ClassName, 'studentCount'>
  }

  async deleteClass(classId: string): Promise<boolean> {
    const { error: deleteError } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId)

    if (deleteError) throw deleteError
    return true
  }

  async linkTeacherToClass(
    teacherId: string,
    classId: string,
    matiere?: string
  ): Promise<SupabaseTeacherLinkResponse[]> {
    const { data, error } = await supabase
      .from('classe_enseignant')
      .insert([
        {
          enseignant_id: teacherId,
          classe_id: classId,
          matiere: matiere || null,
        },
      ])
      .select()

    if (error) throw error
    if (!data) return []

    return data as SupabaseTeacherLinkResponse[]
  }
}

export const classService = new ClassService()
