// services/grade/grade.service.ts
import { supabase } from '@/supabase/supabaseClient'
import { SupabaseErrorHandler } from '../core/Supabase.error.handler'

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

class GradeService {
  /**
   * Récupère une note existante pour pré-remplir le formulaire.
   * Retourne null si l'élève n'a pas encore de note pour cette matière/tranche.
   */
  async getGrade(
    eleveId: string,
    subject: string,
    tranche: number,
    schoolYear: string
  ): Promise<Grade | null> {
    if (!eleveId || !subject) throw new Error('Élève et matière requis.')

    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .eq('eleve_id', eleveId)
      .eq('subject', subject)
      .eq('tranche', tranche)
      .eq('school_year', schoolYear)
      .maybeSingle()

    if (error) {
      SupabaseErrorHandler.handle(error)
      throw error
    }
    return data
  }

  /**
   * Crée ou met à jour la note (upsert basé sur la contrainte unique).
   * `teacher_id` doit être l'auth.uid() du prof connecté — jamais transmis
   * en clair depuis un champ modifiable côté client au-delà de ce que
   * l'appelant contrôle, la policy RLS revérifie de toute façon côté serveur.
   */
  async saveGrade(entry: GradeEntry): Promise<Grade> {
    if (entry.score > entry.max_score) {
      throw new Error('La note ne peut pas dépasser le barème.')
    }

    try {
      const { data, error } = await supabase
        .from('grades')
        .upsert(entry, { onConflict: 'eleve_id,subject,tranche,school_year' })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      SupabaseErrorHandler.handle(error)
      throw error
    }
  }
}

export const gradeService = new GradeService()
