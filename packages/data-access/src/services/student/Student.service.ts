
import { supabase } from '../../supabase/supabaseClient'
import type { EleveDetails, InscriptionStatus } from '@sacre-coeur/domain/types'
import { DomainError } from '@sacre-coeur/domain/errors'
import { requireUuid } from '@sacre-coeur/domain/validation'
import { studentSchema } from '@sacre-coeur/domain/validators/usersSchema'
import { inscriptionService } from './inscription.service'

export type { InscriptionStatus } from '@sacre-coeur/domain/types'
type StudentInput = Omit<EleveDetails, 'id' | 'parent_id' | 'updated_at' | 'inscriptions' | 'inscription_id' | 'status' | 'classe_id' | 'nom_classe' | 'currentClassId' | 'currentClassLabel'>
export interface UpdateStudentStatusDTO { inscriptionId: string; status: InscriptionStatus }
export interface UpdatedInscription { id: string; status: InscriptionStatus; updated_at: string | null; eleve_id?: string; classe_id?: string }
interface ClassRelation { id: string; nom_classe: string }
interface EnrollmentRelation { id: string; status: InscriptionStatus; classe_id: string | null; classes: ClassRelation | ClassRelation[] | null }
interface StudentRow extends Omit<EleveDetails, 'inscriptions'> { inscriptions?: EnrollmentRelation[] | EnrollmentRelation | null }

const STUDENT_SELECT = '*, inscriptions(id, status, classe_id, date_inscription, classes(id, nom_classe))'

function firstClass(value: EnrollmentRelation['classes']): ClassRelation | null {
  return Array.isArray(value) ? value[0] ?? null : value
}

function mapStudent(row: StudentRow): EleveDetails {
  const enrollments = Array.isArray(row.inscriptions) ? row.inscriptions : row.inscriptions ? [row.inscriptions] : []
  const latest = enrollments[0]
  const accepted = enrollments.find(enrollment => enrollment.status === 'accepte')
  const assignedClass = accepted ? firstClass(accepted.classes) : null
  // Le statut et nom_classe concernent la dernière demande ; currentClassId la dernière classe acceptée.
  return { ...row, inscriptions: undefined, status: latest?.status ?? 'en_attente', inscription_id: latest?.id ?? null,
    classe_id: latest?.classe_id ?? null, nom_classe: latest ? firstClass(latest.classes)?.nom_classe ?? 'Non assigné' : 'Non assigné',
    currentClassId: accepted?.classe_id ?? row.currentClassName,
    currentClassLabel: assignedClass?.nom_classe }
}

function normalizeStudent(values: unknown, partial = false) {
  const schema = partial ? studentSchema.partial() : studentSchema
  const result = schema.safeParse(values)
  if (!result.success) throw new DomainError(result.error.issues[0]?.message ?? 'Informations de l’élève invalides.')
  return result.data
}

class StudentService {
  private async getAuthenticatedUserId(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    if (!user) throw new DomainError('Veuillez vous reconnecter.')
    return user.id
  }

  async getAllStudents(): Promise<EleveDetails[]> {
    const { data, error } = await supabase.from('eleves_details').select(STUDENT_SELECT)
      .order('updatedAt', { ascending: false }).order('date_inscription', { referencedTable: 'inscriptions', ascending: false })
    if (error) throw error
    return ((data ?? []) as unknown as StudentRow[]).map(mapStudent)
  }

  async updateStudentStatus({ inscriptionId, status }: UpdateStudentStatusDTO): Promise<UpdatedInscription> {
    requireUuid(inscriptionId, "Identifiant d'inscription")
    if (status !== 'accepte' && status !== 'rejete') throw new DomainError('Statut de validation invalide.')
    const { data, error } = await supabase.from('inscriptions').update({ status, updated_at: new Date().toISOString() })
      .eq('id', inscriptionId).select('id,status,updated_at,eleve_id,classe_id').single()
    if (error) throw error
    return data
  }

  async getStudentsByParent(): Promise<EleveDetails[]> {
    const parentId = await this.getAuthenticatedUserId()
    const { data, error } = await supabase.from('eleves_details').select(STUDENT_SELECT).eq('parent_id', parentId)
      .order('updatedAt', { ascending: false }).order('date_inscription', { referencedTable: 'inscriptions', ascending: false })
    if (error) throw error
    return ((data ?? []) as unknown as StudentRow[]).map(mapStudent)
  }

  async getStudentById(studentId: string): Promise<EleveDetails> {
    requireUuid(studentId, "Identifiant de l'élève")
    const parentId = await this.getAuthenticatedUserId()
    const { data, error } = await supabase.from('eleves_details').select(STUDENT_SELECT).eq('id', studentId).eq('parent_id', parentId)
      .order('date_inscription', { referencedTable: 'inscriptions', ascending: false }).single()
    if (error) throw error
    return mapStudent(data as unknown as StudentRow)
  }

  async createStudent(values: StudentInput): Promise<EleveDetails> {
    // Zod retire les champs dérivés et interdit de transmettre parent_id depuis le formulaire.
    const payload = normalizeStudent(values)
    const parentId = await this.getAuthenticatedUserId()
    const { data, error } = await supabase.from('eleves_details').insert({ ...payload, parent_id: parentId }).select().single()
    if (error) throw error
    return data
  }

  /** Compensation limitée au dossier qui vient d'être créé ; ce flux n'est pas une transaction SQL. */
  async createStudentWithInscription(values: StudentInput, anneeScolaire: string): Promise<EleveDetails> {
    const student = await this.createStudent(values)
    try {
      await inscriptionService.createInscription({ eleveId: student.id, classeId: values.currentClassName, anneeScolaire })
      return student
    } catch (error) {
      try { await this.deleteStudent(student.id) }
      catch (cleanupError) {
        console.error('[StudentService.createStudentWithInscription] Compensation échouée', cleanupError)
        throw new DomainError("Le dossier a été créé, mais la demande d'inscription a échoué. Contactez l'administration avant de réessayer.", { cause: error })
      }
      throw error
    }
  }

  async updateStudent(studentId: string, values: Partial<StudentInput>): Promise<EleveDetails> {
    requireUuid(studentId, "Identifiant de l'élève")
    const payload = normalizeStudent(values, true)
    if (!Object.keys(payload).length) throw new DomainError('Aucune modification à appliquer.')
    const parentId = await this.getAuthenticatedUserId()
    if (payload.currentClassName !== undefined) {
      const { data: current, error: fetchError } = await supabase.from('eleves_details').select('currentClassName').eq('id', studentId).eq('parent_id', parentId).single()
      if (fetchError) throw fetchError
      if (payload.currentClassName !== current.currentClassName) throw new DomainError('Le changement de classe doit passer par une réinscription.')
    }
    const { data, error } = await supabase.from('eleves_details').update(payload).eq('id', studentId).eq('parent_id', parentId).select().single()
    if (error) throw error
    return data
  }

  async deleteStudent(studentId: string): Promise<void> {
    requireUuid(studentId, "Identifiant de l'élève")
    const parentId = await this.getAuthenticatedUserId()
    const { error } = await supabase.from('eleves_details').delete().eq('id', studentId).eq('parent_id', parentId).select('id').single()
    if (error) throw error
  }
}

export const studentService = new StudentService()
