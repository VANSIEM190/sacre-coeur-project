import { supabase } from '@/supabase/supabaseClient'
import type { ClassName, EleveDetails } from '@/lib/types'

interface SupabaseClassRow {
  id: string
  nom_classe: string
  annee_scolaire: string
  inscriptions: { id: string; status: string }[]
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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

class ClassService {
  private isValidUuid(id: string): boolean {
    return UUID_REGEX.test(id)
  }

  private async getCurrentUserId(): Promise<string> {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error || !user) {
      throw new Error('Session invalide ou utilisateur non authentifié.')
    }
    return user.id
  }

  /**
   * studentCount ne compte que les inscriptions VALIDÉES.
   * La RLS reste la barrière principale ; ce filtre corrige surtout
   * un bug métier (compter des inscriptions en attente comme élèves actifs).
   */
  async getAllClasses(): Promise<ClassName[]> {
    const { data, error } = await supabase
      .from('classes')
      .select('id, nom_classe, annee_scolaire, inscriptions(id, status)')
      .order('nom_classe', { ascending: true })
      .returns<SupabaseClassRow[]>()

    if (error) {
      console.error('[ClassService.getAllClasses]:', error.message)
      throw new Error('Impossible de récupérer la liste des classes.')
    }

    if (!data) return []

    return data.map(classe => ({
      id: classe.id,
      nom_classe: classe.nom_classe,
      annee_scolaire: classe.annee_scolaire,
      studentCount: classe.inscriptions
        ? classe.inscriptions.filter(i => i.status === 'accepte').length
        : 0,
    }))
  }

  /**
   * Sécurité : cette méthode ne remplace PAS la RLS — elle ajoute une
   * validation défensive côté client pour échouer tôt avec un message
   * clair. La vraie barrière reste la policy RLS sur `inscriptions`,
   * qui doit restreindre l'accès aux enseignants dont `classe_id` figure
   * dans leur `assignedclasses`, ou aux admins.
   * Filtre aussi sur status = 'valide' pour ne montrer que les élèves
   * réellement inscrits.
   */
  async getStudentsInClass(classId: string): Promise<EleveDetails[]> {
    if (!classId || !this.isValidUuid(classId)) return []

    const { data, error } = await supabase
      .from('inscriptions')
      .select('eleves_details(*)')
      .eq('classe_id', classId)
      .eq('status', 'accepte')
      .returns<SupabaseInscriptionRow[]>()

    if (error) {
      console.error('[ClassService.getStudentsInClass]:', error.message)
      throw new Error('Erreur lors de la récupération des élèves.')
    }

    if (!data) return []

    const students: EleveDetails[] = data
      .map(row => row.eleves_details)
      .filter((student): student is EleveDetails => student !== null)

    console.log(data)

    return students.sort((a, b) => a.lastName.localeCompare(b.lastName))
  }

  /**
   * Sécurité : le nettoyage (.trim()) protège seulement contre des noms
   * de classe pollués par des espaces ; ce n'est PAS une protection XSS.
   * L'échappement contre le XSS est assuré au rendu par React (JSX
   * échappe automatiquement le texte inséré), pas à l'écriture en base.
   * L'autorisation réelle (admin uniquement) doit être imposée par la
   * policy RLS INSERT sur `classes`.
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
    if (nomNettoye.length > 100 || anneeNettoyee.length > 20) {
      throw new Error('Nom de classe ou année scolaire trop long.')
    }

    const { data, error } = await supabase
      .from('classes')
      .insert([{ nom_classe: nomNettoye, annee_scolaire: anneeNettoyee }])
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
   * Sécurité : la validation de format ici est défensive (échoue tôt,
   * message clair) — l'autorisation réelle (admin uniquement) reste
   * imposée par la policy RLS UPDATE sur `classes`.
   * Seuls les champs fournis sont mis à jour (update partiel).
   */
  async updateClass(
    classId: string,
    values: { nom_classe?: string; annee_scolaire?: string }
  ): Promise<Omit<ClassName, 'studentCount'>> {
    if (!classId || !this.isValidUuid(classId)) {
      throw new Error("L'identifiant de la classe est requis et invalide.")
    }

    const updateData: { nom_classe?: string; annee_scolaire?: string } = {}

    if (values.nom_classe !== undefined) {
      const nomNettoye = values.nom_classe.trim()
      if (!nomNettoye) {
        throw new Error('Le nom de la classe ne peut pas être vide.')
      }
      if (nomNettoye.length > 100) {
        throw new Error('Nom de classe trop long.')
      }
      updateData.nom_classe = nomNettoye
    }

    if (values.annee_scolaire !== undefined) {
      const anneeNettoyee = values.annee_scolaire.trim()
      if (!anneeNettoyee) {
        throw new Error("L'année scolaire ne peut pas être vide.")
      }
      if (anneeNettoyee.length > 20) {
        throw new Error('Année scolaire trop longue.')
      }
      updateData.annee_scolaire = anneeNettoyee
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('Aucune donnée à mettre à jour.')
    }

    const { data, error } = await supabase
      .from('classes')
      .update(updateData)
      .eq('id', classId)
      .select('id, nom_classe, annee_scolaire')
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error(
          `Une classe "${updateData.nom_classe ?? ''}" existe déjà pour cette année scolaire.`
        )
      }
      console.error('[ClassService.updateClass]:', error.message)
      throw new Error('Erreur lors de la mise à jour de la classe.')
    }

    if (!data) throw new Error('Classe introuvable ou aucune donnée renvoyée.')
    return data
  }

  /**
   * Sécurité CRITIQUE : opération admin uniquement — imposée par la RLS
   * DELETE sur `classes`. Garde la contrainte ON DELETE RESTRICT sur
   * `inscriptions.classe_id` pour ne jamais perdre l'historique des élèves.
   */
  async deleteClass(classId: string): Promise<boolean> {
    if (!classId || !this.isValidUuid(classId)) {
      throw new Error("L'identifiant de la classe est requis et invalide.")
    }

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
   * Sécurité : vérifie que `teacherId` correspond bien à un enseignant
   * existant avant de créer la liaison — évite de lier un UUID arbitraire
   * (parent, ID inventé) à une classe. L'autorisation admin reste imposée
   * par la RLS INSERT sur `classe_enseignant`.
   */
  async linkTeacherToClass(
    teacherId: string,
    classId: string,
    matiere?: string
  ): Promise<SupabaseTeacherLinkResponse[]> {
    if (
      !teacherId ||
      !classId ||
      !this.isValidUuid(teacherId) ||
      !this.isValidUuid(classId)
    ) {
      throw new Error(
        "L'enseignant et la classe sont obligatoires et doivent être valides."
      )
    }

    const { data: teacherExists, error: teacherCheckError } = await supabase
      .from('enseignants_details')
      .select('id')
      .eq('id', teacherId)
      .maybeSingle()

    if (teacherCheckError) {
      console.error(
        '[ClassService.linkTeacherToClass] check teacher:',
        teacherCheckError.message
      )
      throw new Error("Erreur lors de la vérification de l'enseignant.")
    }
    if (!teacherExists) {
      throw new Error("Cet enseignant n'existe pas.")
    }

    const { data, error } = await supabase
      .from('classe_enseignant')
      .insert([
        {
          enseignant_id: teacherId,
          classe_id: classId,
          matiere: matiere?.trim().slice(0, 100) || null,
        },
      ])
      .select()
      .returns<SupabaseTeacherLinkResponse[]>()

    if (error) {
      if (error.code === '23505') {
        throw new Error(
          'Cet enseignant est déjà lié à cette classe pour cette matière.'
        )
      }
      console.error('[ClassService.linkTeacherToClass]:', error.message)
      throw new Error("Erreur lors de la liaison de l'enseignant.")
    }

    return data || []
  }
}

export const classService = new ClassService()
