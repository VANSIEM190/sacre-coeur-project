
import { requireText, requireUuid, validateGrade, validateTranche } from '@sacre-coeur/domain/validation'
import { DomainError } from '@sacre-coeur/domain/errors'
import { supabase } from '../../supabase/supabaseClient'

export interface GradeEntry {
  eleve_id: string
  classe_id: string
  teacher_id: string
  subject: string
  tranche: 1 | 2 | 3
  score: number
  max_score: number
  school_year: string
}

export interface Grade extends GradeEntry {
  id: string
  created_at: string
  updated_at: string
}

function validateEntry(entry: GradeEntry): GradeEntry {
  requireUuid(entry.eleve_id, "Identifiant de l'élève")
  requireUuid(entry.classe_id, 'Identifiant de classe')
  requireUuid(entry.teacher_id, "Identifiant de l'enseignant")
  validateTranche(entry.tranche)
  validateGrade(entry.score, entry.max_score)
  return {
    eleve_id: entry.eleve_id, classe_id: entry.classe_id, teacher_id: entry.teacher_id,
    tranche: entry.tranche, score: entry.score, max_score: entry.max_score,
    subject: requireText(entry.subject, 'Matière'), school_year: requireText(entry.school_year, 'Année scolaire'),
  }
}

function mapGrade(grade: Grade): Grade {
  return { ...grade, score: Number(grade.score), max_score: Number(grade.max_score) }
}

class GradeService {
  async getGrade(eleveId: string, subject: string, tranche: number, schoolYear: string): Promise<Grade | null> {
    requireUuid(eleveId, "Identifiant de l'élève")
    validateTranche(tranche)
    const { data, error } = await supabase.from('grades').select('*')
      .eq('eleve_id', eleveId).eq('subject', requireText(subject, 'Matière')).eq('tranche', tranche)
      .eq('school_year', requireText(schoolYear, 'Année scolaire')).maybeSingle()
    if (error) throw error
    return data ? mapGrade(data) : null
  }

  /** grades.teacher_id désigne l'utilisateur Auth, pas enseignants_details.id. */
  async getTeacherGrades(teacherId: string, schoolYear: string): Promise<Grade[]> {
    requireUuid(teacherId, "Identifiant de l'enseignant")
    const { data, error } = await supabase.from('grades').select('*').eq('teacher_id', teacherId)
      .eq('school_year', requireText(schoolYear, 'Année scolaire')).order('subject', { ascending: true })
    if (error) throw error
    return (data ?? []).map(mapGrade)
  }

  async getClassGrades(classId: string, schoolYear: string): Promise<Grade[]> {
    requireUuid(classId, 'Identifiant de classe')
    const { data, error } = await supabase.from('grades').select('*').eq('classe_id', classId)
      .eq('school_year', requireText(schoolYear, 'Année scolaire')).order('subject', { ascending: true })
    if (error) throw error
    return (data ?? []).map(mapGrade)
  }

  async saveGrade(entry: GradeEntry): Promise<Grade> {
    const grades = await this.saveGrades([entry])
    if (!grades[0]) throw new DomainError("La note n'a pas été enregistrée.")
    return grades[0]
  }

  /** Une seule requête pour le lot. La contrainte unique utilisée existait déjà dans le service initial. */
  async saveGrades(entries: GradeEntry[]): Promise<Grade[]> {
    if (!entries.length) throw new DomainError('Aucune note à enregistrer.')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError
    if (!user) throw new DomainError('Veuillez vous reconnecter.')
    const seen = new Set<string>()
    const payload = entries.map(entry => {
      if (entry.teacher_id !== user.id) throw new DomainError("L'enseignant doit correspondre au compte connecté.")
      const validated = validateEntry(entry)
      const key = [validated.eleve_id, validated.subject, validated.tranche, validated.school_year].join('|')
      if (seen.has(key)) throw new DomainError('Le lot contient plusieurs notes pour le même élève, matière et tranche.')
      seen.add(key)
      return validated
    })
    const { data, error } = await supabase.from('grades')
      .upsert(payload, { onConflict: 'eleve_id,subject,tranche,school_year' }).select()
    if (error) throw error
    return (data ?? []).map(mapGrade)
  }
}

export const gradeService = new GradeService()
