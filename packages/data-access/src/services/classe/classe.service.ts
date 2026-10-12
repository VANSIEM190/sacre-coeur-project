
import { supabase } from '../../supabase/supabaseClient'
import type { ClassName, EleveDetails } from '@sacre-coeur/domain/types'
import { requireText, requireUuid } from '@sacre-coeur/domain/validation'
import { DomainError } from '@sacre-coeur/domain/errors'

interface ClassRow {
  id: string
  nom_classe: string
  annee_scolaire: string
  inscriptions: { id: string; status: string }[] | null
}
interface EnrollmentStudentRow { eleves_details: EleveDetails | null }

class ClassService {
  async getAllClasses(): Promise<ClassName[]> {
    const { data, error } = await supabase.from('classes')
      .select('id,nom_classe,annee_scolaire,inscriptions(id,status)').order('nom_classe', { ascending: true }).returns<ClassRow[]>()
    if (error) throw error
    return (data ?? []).map(row => ({
      id: row.id, nom_classe: row.nom_classe, annee_scolaire: row.annee_scolaire,
      studentCount: (row.inscriptions ?? []).filter(enrollment => enrollment.status === 'accepte').length,
    }))
  }

  async getStudentsInClass(classId: string): Promise<EleveDetails[]> {
    requireUuid(classId, 'Identifiant de classe')
    const { data, error } = await supabase.from('inscriptions').select('eleves_details(*)')
      .eq('classe_id', classId).eq('status', 'accepte').returns<EnrollmentStudentRow[]>()
    if (error) throw error
    return (data ?? []).map(row => row.eleves_details).filter((student): student is EleveDetails => student !== null)
      .sort((first, second) => first.lastName.localeCompare(second.lastName))
  }

  async createClass(nomClasse: string, anneeScolaire: string): Promise<Omit<ClassName, 'studentCount'>> {
    const name = requireText(nomClasse, 'Nom de classe')
    const year = requireText(anneeScolaire, 'Année scolaire')
    if (name.length > 100 || year.length > 20) throw new DomainError('Nom de classe ou année scolaire trop long.')
    const { data, error } = await supabase.from('classes').insert({ nom_classe: name, annee_scolaire: year })
      .select('id,nom_classe,annee_scolaire').single()
    if (error) throw error
    return data
  }

  async updateClass(classId: string, values: { nom_classe?: string; annee_scolaire?: string }): Promise<Omit<ClassName, 'studentCount'>> {
    requireUuid(classId, 'Identifiant de classe')
    const payload: typeof values = {}
    if (values.nom_classe !== undefined) {
      payload.nom_classe = requireText(values.nom_classe, 'Nom de classe')
      if (payload.nom_classe.length > 100) throw new DomainError('Nom de classe trop long.')
    }
    if (values.annee_scolaire !== undefined) {
      payload.annee_scolaire = requireText(values.annee_scolaire, 'Année scolaire')
      if (payload.annee_scolaire.length > 20) throw new DomainError('Année scolaire trop longue.')
    }
    if (!Object.keys(payload).length) throw new DomainError('Aucune modification à appliquer.')
    const { data, error } = await supabase.from('classes').update(payload).eq('id', classId)
      .select('id,nom_classe,annee_scolaire').single()
    if (error) throw error
    return data
  }

  async deleteClass(classId: string): Promise<boolean> {
    requireUuid(classId, 'Identifiant de classe')
    const { error } = await supabase.from('classes').delete().eq('id', classId)
    if (error?.code === '23503') throw new DomainError('Des élèves, cours ou horaires sont encore rattachés à cette classe.', { cause: error })
    if (error) throw error
    return true
  }
}

export const classService = new ClassService()
