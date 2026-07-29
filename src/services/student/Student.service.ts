import { supabase } from '@/supabase/supabaseClient'
import type { EleveDetails } from '@/lib/types'

// 'en_attente' est l'état initial posé à l'inscription — jamais un statut
// qu'on doit pouvoir REposer via updateStudentStatus (voir ALLOWED_TRANSITIONS).
export type InscriptionStatus = 'en_attente' | 'accepte' | 'rejete'

export interface UpdateStudentStatusDTO {
  inscriptionId: string
  status: InscriptionStatus
}

export interface UpdatedInscription {
  id: string
  status: InscriptionStatus
  updated_at: string | null
  eleve_id?: string
  classe_id?: string
}

// Typage interne précis de la réponse Supabase avec jointures
interface RawClasseRelation {
  id: string
  nom_classe: string
}

interface RawInscriptionRelation {
  id: string
  status: InscriptionStatus
  classe_id: string | null
  classes: RawClasseRelation | RawClasseRelation[] | null
}

interface RawEleveDetails extends Omit<
  EleveDetails,
  'status' | 'classe_id' | 'nom_classe' | 'inscription_id' | 'inscriptions'
> {
  inscriptions?: RawInscriptionRelation | RawInscriptionRelation[] | null
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Seules ces transitions sont autorisées depuis l'écran de validation admin.
// 'en_attente' n'y figure pas volontairement : un dossier déjà traité ne
// doit pas pouvoir être remis en attente via cette méthode.
const ALLOWED_STATUS_TRANSITIONS: InscriptionStatus[] = ['accepte', 'rejete']

class StudentService {
  private isValidUuid(id: string): boolean {
    return UUID_REGEX.test(id)
  }

  /**
   * Helper privé pour vérifier l'authentification et récupérer l'ID utilisateur.
   */
  private async getAuthenticatedUserId(): Promise<string> {
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
   * Helper d'extraction sécurisée de la classe
   */
  private extractClassName(
    classes: RawClasseRelation | RawClasseRelation[] | null
  ): string {
    if (!classes) return 'Non assigné'
    if (Array.isArray(classes)) {
      return classes[0]?.nom_classe || 'Non assigné'
    }
    return classes.nom_classe || 'Non assigné'
  }

  /**
   * Récupère tous les élèves avec leurs inscriptions et classe rattachée.
   * L'inscription retenue est la plus récente (triée par date_inscription
   * décroissante côté requête) — sans ce tri explicite, Postgres ne
   * garantit aucun ordre sur une relation imbriquée.
   * Sécurité : lecture admin uniquement, imposée par la RLS SELECT sur
   * `eleves_details` et `inscriptions`.
   */
  async getAllStudents(): Promise<EleveDetails[]> {
    const { data, error } = await supabase
      .from('eleves_details')
      .select(
        `
        *,
        inscriptions (
          id,
          status,
          classe_id,
          date_inscription,
          classes (
            id,
            nom_classe
          )
        )
      `
      )
      .order('updatedAt', { ascending: false })
      .order('date_inscription', {
        foreignTable: 'inscriptions',
        ascending: false,
      })

    if (error) {
      console.error('[StudentService.getAllStudents]:', error.message)
      throw new Error('Impossible de récupérer la liste des élèves.', {
        cause: error,
      })
    }

    const rawData = (data ?? []) as unknown as RawEleveDetails[]

    // Mapping sécurisé vers EleveDetails
    return rawData.map((eleve): EleveDetails => {
      const latestInscription = Array.isArray(eleve.inscriptions)
        ? eleve.inscriptions[0]
        : eleve.inscriptions

      const className = this.extractClassName(
        latestInscription?.classes ?? null
      )

      return {
        ...eleve,
        status: latestInscription?.status ?? 'en_attente',
        classe_id: latestInscription?.classe_id ?? null,
        nom_classe: className,
        inscription_id: latestInscription?.id ?? null,
      } as EleveDetails
    })
  }

  /**
   * Met à jour le statut d'inscription d'un élève.
   * Sécurité : validation défensive du format d'ID et de la transition de
   * statut autorisée — n'empêche pas un contournement de la RLS, mais
   * échoue tôt avec un message clair. L'autorisation réelle (admin
   * uniquement) reste imposée par la policy RLS UPDATE sur `inscriptions`.
   */
  async updateStudentStatus({
    inscriptionId,
    status,
  }: UpdateStudentStatusDTO): Promise<UpdatedInscription> {
    if (!inscriptionId || !this.isValidUuid(inscriptionId)) {
      throw new Error("L'identifiant d'inscription est requis et invalide.")
    }
    if (!ALLOWED_STATUS_TRANSITIONS.includes(status)) {
      throw new Error('Statut de validation invalide.')
    }

    const { data, error } = await supabase
      .from('inscriptions')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inscriptionId)
      .select('id, status, updated_at, eleve_id, classe_id')
      .single()

    if (error) {
      console.error('[StudentService.updateStudentStatus]:', error.message)
      throw new Error('Erreur lors de la mise à jour du statut.', {
        cause: error,
      })
    }

    return data as UpdatedInscription
  }

  /**
   * Récupère tous les élèves rattachés au parent authentifié.
   * Sécurité : isolation stricte par parent_id — un parent ne peut
   * accéder qu'à ses propres enfants. Doublée par la RLS SELECT.
   */
  async getStudentsByParent(): Promise<EleveDetails[]> {
    const userId = await this.getAuthenticatedUserId()

    const { data, error } = await supabase
      .from('eleves_details')
      .select('*')
      .eq('parent_id', userId)
      .order('updatedAt', { ascending: false })

    if (error) {
      console.error('[StudentService.getStudentsByParent]:', error.message)
      throw new Error('Impossible de récupérer vos élèves.', { cause: error })
    }
    return (data ?? []) as EleveDetails[]
  }

  /**
   * Récupère un élève spécifique par son ID (Isolé strictement par parent_id).
   */
  async getStudentById(studentId: string): Promise<EleveDetails> {
    if (!studentId || !this.isValidUuid(studentId)) {
      throw new Error("L'identifiant de l'élève est requis et invalide.")
    }
    const userId = await this.getAuthenticatedUserId()

    const { data, error } = await supabase
      .from('eleves_details')
      .select('*')
      .eq('id', studentId)
      .eq('parent_id', userId)
      .single()

    if (error) {
      console.error('[StudentService.getStudentById]:', error.message)
      throw new Error('Élève introuvable ou accès non autorisé.', {
        cause: error,
      })
    }
    return data as EleveDetails
  }

  /**
   * Enregistre un nouvel élève en liant automatiquement son parent_id.
   * Sécurité : parent_id est forcé côté serveur depuis la session
   * authentifiée — jamais depuis studentData, pour empêcher un parent
   * de créer un élève rattaché à un autre parent_id arbitraire.
   */
  async createStudent(
    studentData: Omit<
      EleveDetails,
      'id' | 'parent_id' | 'updatedAt' | 'createdAt'
    >
  ): Promise<EleveDetails> {
    const userId = await this.getAuthenticatedUserId()

    // On retire explicitement tout parent_id éventuellement injecté dans
    // studentData avant de le fusionner, pour ne jamais laisser un
    // parent_id fourni par le client écraser celui de la session.
    const { parent_id: _ignored, ...safeStudentData } = studentData as Record<
      string,
      unknown
    >

    if (Object.keys(safeStudentData).length === 0) {
      throw new Error('Pas de champ renseigné.')
    }

    const payload = {
      ...safeStudentData,
      parent_id: userId,
    }

    const { data, error } = await supabase
      .from('eleves_details')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('[StudentService.createStudent]:', error.message)
      throw new Error("Erreur lors de la création de l'élève.", {
        cause: error,
      })
    }
    return data as EleveDetails
  }

  /**
   * Met à jour les informations d'un élève.
   * Sécurité : même précaution que createStudent — parent_id ne peut
   * jamais être modifié via studentData, et le .eq('parent_id', userId)
   * garantit qu'un parent ne peut modifier que ses propres élèves.
   */
  async updateStudent(
    studentId: string,
    studentData: Partial<Omit<EleveDetails, 'id' | 'parent_id'>>
  ): Promise<EleveDetails> {
    if (!studentId || !this.isValidUuid(studentId)) {
      throw new Error("L'identifiant de l'élève est requis et invalide.")
    }
    const userId = await this.getAuthenticatedUserId()

    const { parent_id: _ignored, ...safeStudentData } = studentData as Record<
      string,
      unknown
    >

    if (Object.keys(safeStudentData).length === 0) {
      throw new Error('Aucune donnée à mettre à jour.')
    }

    const { data, error } = await supabase
      .from('eleves_details')
      .update(safeStudentData)
      .eq('id', studentId)
      .eq('parent_id', userId)
      .select()
      .single()

    if (error) {
      console.error('[StudentService.updateStudent]:', error.message)
      throw new Error('Erreur lors de la mise à jour.', { cause: error })
    }
    return data as EleveDetails
  }

  /**
   * Supprime un élève de la base de données.
   */
  async deleteStudent(studentId: string): Promise<void> {
    if (!studentId || !this.isValidUuid(studentId)) {
      throw new Error("L'identifiant de l'élève est requis et invalide.")
    }
    const userId = await this.getAuthenticatedUserId()

    const { error } = await supabase
      .from('eleves_details')
      .delete()
      .eq('id', studentId)
      .eq('parent_id', userId)

    if (error) {
      console.error('[StudentService.deleteStudent]:', error.message)
      throw new Error('Erreur lors de la suppression.', { cause: error })
    }
  }
}

export const studentService = new StudentService()
