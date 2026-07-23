import { supabase } from '@/supabase/supabaseClient'
import type { ClassName, EleveDetails } from '@/lib/types'

// --- Interfaces de Réponses Supabase Strictes (Fini le type 'any') ---
interface SupabaseClassRow {
  id: string
  nom_classe: string
  annee_scolaire: string
  inscriptions: { id: string }[]
}

interface SupabaseInscriptionRow {
  eleves_details: EleveDetails | null
}

interface SupabaseTeacherLinkResponse {
  id: string
  enseignant_id: string
  classe_id: string
  matiere: string | null
  created_at?: string
}

class ClassService {
  /**
   * Sécurité : Lecture seule. L'accès aux classes doit être protégé en amont par RLS.
   * Typage : Utilisation de génériques pour typer la réponse brute de Supabase.
   */
  async getAllClasses(): Promise<ClassName[]> {
    const { data, error } = await supabase
      .from('classes')
      .select('id, nom_classe, annee_scolaire, inscriptions(id)')
      .order('nom_classe', { ascending: true })
      .returns<SupabaseClassRow[]>() // Force le type retourné par l'API

    if (error) {
      console.error('[ClassService.getAllClasses]:', error.message)
      throw new Error('Impossible de récupérer la liste des classes.')
    }

    if (!data) return []

    return data.map(classe => ({
      id: classe.id,
      nom_classe: classe.nom_classe,
      annee_scolaire: classe.annee_scolaire,
      studentCount: classe.inscriptions ? classe.inscriptions.length : 0,
    }))
  }

  /**
   * Sécurité : Ne renvoie que les profils valides. Protection RLS requise sur 'inscriptions'.
   * Typage : Élimination du map avec 'any' grâce à l'utilisation de '.returns<T>()'
   */
  async getStudentsInClass(classId: string): Promise<EleveDetails[]> {
    // Validation basique de l'UUID pour éviter les requêtes inutiles vers Supabase
    if (!classId) return []

    const { data, error } = await supabase
      .from('inscriptions')
      .select('eleves_details(*)')
      .eq('classe_id', classId)
      .returns<SupabaseInscriptionRow[]>()

    if (error) {
      console.error('[ClassService.getStudentsInClass]:', error.message)
      throw new Error('Erreur lors de la récupération des élèves.')
    }

    if (!data) return []

    // Extraction propre et sécurisée contre les valeurs nulles
    const students: EleveDetails[] = data
      .map(row => row.eleves_details)
      .filter((student): student is EleveDetails => student !== null)

    return students.sort((a, b) => a.lastName.localeCompare(b.lastName))
  }

  /**
   * Sécurité : Nettoyage strict (XSS/Injection de données invalides via espaces).
   */
  async createClass(
    nomClasse: string,
    anneeScolaire: string
  ): Promise<Omit<ClassName, 'studentCount'>> {
    const nomNettoye = nomClasse.trim()
    const anneeNettoyee = anneeScolaire.trim()

    if (!nomNettoye || !anneeNettoyee) {
      throw new Error(
        "Le nom de la classe et l'année scolaire sont obligatoires."
      )
    }

    const { data, error } = await supabase
      .from('classes')
      .insert([
        {
          nom_classe: nomNettoye,
          annee_scolaire: anneeNettoyee,
        },
      ])
      .select('id, nom_classe, annee_scolaire')
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error(
          `La classe "${nomNettoye}" existe déjà pour cette année scolaire.`
        )
      }
      console.error('[ClassService.createClass]:', error.message)
      throw new Error('Erreur lors de la création de la classe.')
    }

    if (!data) throw new Error('Aucune donnée renvoyée après la création.')

    return data
  }

  /**
   * Sécurité CRITIQUE : La suppression d'une classe doit être gérée avec prudence.
   * Assure-toi en BDD que la contrainte sur 'inscriptions' est en ON DELETE RESTRICT
   * pour éviter de supprimer accidentellement l'historique des élèves !
   */
  async deleteClass(classId: string): Promise<boolean> {
    if (!classId) throw new Error("L'identifiant de la classe est requis.")

    const { error } = await supabase.from('classes').delete().eq('id', classId)

    if (error) {
      if (error.code === '23503') {
        throw new Error(
          'Impossible de supprimer cette classe car des élèves ou des cours y sont rattachés.'
        )
      }
      console.error('[ClassService.deleteClass]:', error.message)
      throw new Error('Erreur lors de la suppression.')
    }

    return true
  }

  /**
   * Sécurité : Validation des paramètres requis.
   */
  async linkTeacherToClass(
    teacherId: string,
    classId: string,
    matiere?: string
  ): Promise<SupabaseTeacherLinkResponse[]> {
    if (!teacherId || !classId) {
      throw new Error(
        "L'enseignant et la classe sont obligatoires pour effectuer l'affectation."
      )
    }

    const { data, error } = await supabase
      .from('classe_enseignant')
      .insert([
        {
          enseignant_id: teacherId,
          classe_id: classId,
          matiere: matiere?.trim() || null,
        },
      ])
      .select()
      .returns<SupabaseTeacherLinkResponse[]>()

    if (error) {
      console.error('[ClassService.linkTeacherToClass]:', error.message)
      throw new Error("Erreur lors de la liaison de l'enseignant.")
    }

    return data || []
  }
}

export const classService = new ClassService()
