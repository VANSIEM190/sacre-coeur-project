import { toast } from 'sonner'

export interface PostgrestError {
  code: string
  message: string
  details: string
  hint: string
}

export class SupabaseErrorHandler {
  /**
   * Analyse une erreur Supabase/PostgreSQL, déclenche un toast Sonner,
   * et retourne le message nettoyé.
   */
  static handle(error: any): string {
    let cleanMessage

    // Log en développement pour faciliter le débug
    // if (process.env.NODE_ENV !== 'production') {
    //   console.error(' [Supabase Error Debug]:', error)
    // }

    // 1. Détection robuste des erreurs d'authentification Supabase Auth (GoTrue)
    const isAuthError =
      error?.constructor?.name === 'AuthError' ||
      error?.__isAuthError === true ||
      (error?.status && error?.message && !error?.code)

    if (isAuthError) {
      cleanMessage = this.handleAuthError(error)
    }
    // 2. Erreurs PostgREST ou PostgreSQL natives (Contient un attribut 'code')
    else if (error?.code) {
      cleanMessage = this.handleDatabaseError(error)
    }
    // 3. Erreurs réseau globales ou Fetch interrompus
    else if (
      error?.message === 'Failed to fetch' ||
      error?.name === 'TypeError'
    ) {
      cleanMessage =
        'Problème de connexion réseau. Veuillez vérifier votre accès internet.'
    }
    // 4. Fallback de secours
    else {
      cleanMessage =
        error?.message ||
        'Une erreur inattendue est survenue. Veuillez réessayer.'
    }

    // Déclenchement du Toast avec Sonner (Design moderne et accessible)
    toast.error(cleanMessage, {
      duration: 5000,
      closeButton: true,
    })

    return cleanMessage
  }

  /**
   * Traitement spécifique des erreurs d'authentification
   */
  private static handleAuthError(error: any): string {
    const message = error.message?.toLowerCase() || ''
    const status = error.status

    if (
      message.includes('user already exists') ||
      message.includes('already been registered')
    ) {
      return 'Cette adresse email est déjà associée à un compte.'
    }
    if (message.includes('invalid login credentials')) {
      return 'Email ou mot de passe incorrect.'
    }
    if (message.includes('email rate limit exceeded') || status === 429) {
      return 'Trop de tentatives en peu de temps. Veuillez patienter quelques minutes.'
    }
    if (message.includes('password should be at least')) {
      return 'Le mot de passe est trop court (minimum 6 caractères).'
    }
    if (
      status === 400 &&
      (message.includes('invalid format') || message.includes('user_metadata'))
    ) {
      return 'Le format des informations transmises est invalide.'
    }
    if (message.includes('email not confirmed')) {
      return 'Veuillez confirmer votre adresse e-mail avant de vous connecter.'
    }

    return `Erreur d'accès : ${error.message}`
  }

  /**
   * Traitement spécifique des erreurs PostgreSQL & PostgREST
   */
  private static handleDatabaseError(error: PostgrestError | any): string {
    const code = error.code
    const details = error.details?.toLowerCase() || ''
    const message = error.message?.toLowerCase() || ''

    switch (code) {
      // 23505: Violation de contrainte UNIQUE
      case '23505':
        if (
          details.includes('matriculeenseignant') ||
          message.includes('matriculeenseignant')
        ) {
          return "Ce matricule d'enseignant est déjà attribué."
        }
        if (
          details.includes('nom_classe') ||
          message.includes('nom_classe') ||
          details.includes('classes')
        ) {
          return 'Une classe portant ce nom existe déjà pour cette année scolaire.'
        }
        return 'Cette donnée existe déjà dans notre système.'

      // 42501: Violation des règles RLS (Row Level Security)
      case '42501':
        return "Droits insuffisants : Vous n'avez pas l'autorisation de modifier ou lire ces données."

      // 23503: Violation de clé étrangère (Foreign Key)
      case '23503':
        return "Action impossible : L'élément auquel vous tentez de l'associer n'existe plus."

      // PGRST116: Erreur PostgREST fréquente avec .single()
      case 'PGRST116':
        return 'Aucun enregistrement ou enregistrements multiples trouvés pour cette requête.'

      // 22001: Valeur trop longue pour le type (ex: varchar(15))
      case '22001':
        return "L'un des champs contient trop de caractères."

      // 08006 / 57P01: Déconnexion serveur ou crash de session réseau
      case '08006':
      case '57P01':
        return 'La connexion avec le serveur a été interrompue. Veuillez rafraîchir la page.'

      // 42703: Erreur de code développeur (colonne inexistante)
      case '42703':
        return 'Erreur de configuration de la structure de données (Colonne manquante).'

      default:
        return `Erreur système (${code}) : ${error.message}`
    }
  }
}
