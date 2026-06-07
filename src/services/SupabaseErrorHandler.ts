import { AuthError } from '@supabase/supabase-js'

export class SupabaseErrorHandler {
  /**
   * Analyse une erreur venant de Supabase et retourne un message propre et compréhensible.
   */
  static handle(error: any): string {
    // // 1. Log de l'erreur en mode développement pour le débogage
    // if (Vite.meta.env.NODE_ENV !== 'production') {
    //   console.error('------- [SUPABASE ERROR LOG] -------', {
    //     message: error?.message,
    //     code: error?.code,
    //     status: error?.status,
    //     details: error?.details,
    //     hint: error?.hint,
    //     fullError: error
    //   })
    // }

    // 2. Si l'erreur est une instance d'AuthError (Erreurs d'authentification)
    if (
      error instanceof AuthError ||
      error?.constructor?.name === 'AuthError'
    ) {
      return this.handleAuthError(error)
    }

    // 3. Si c'est une erreur de Base de données (PostgreSQL / RLS / Contraintes)
    if (error?.code) {
      return this.handleDatabaseError(error)
    }

    // 4. Erreurs réseau ou générales
    if (error?.message === 'Failed to fetch') {
      return 'Problème de connexion réseau. Veuillez vérifier votre accès internet.'
    }

    // Message par défaut si l'erreur est inconnue
    return (
      error?.message ||
      'Une erreur inattendue est survenue. Veuillez réessayer.'
    )
  }

  /**
   * Traitement spécifique des erreurs d'authentification (SignUp, Login, etc.)
   */
  private static handleAuthError(error: any): string {
    const status = error.status
    const message = error.message.toLowerCase()

    // Traduction des messages d'erreur d'authentification classiques
    if (
      message.includes('user already exists') ||
      message.includes('already been registered')
    ) {
      return 'Cette adresse email est déjà associée à un compte.'
    }
    if (message.includes('invalid login credentials')) {
      return 'Email ou mot de passe incorrect.'
    }
    if (message.includes('email rate limit exceeded')) {
      return 'Trop de tentatives en peu de temps. Veuillez patienter quelques minutes.'
    }
    if (message.includes('password should be at least')) {
      return 'Le mot de passe est trop court (minimum 6 caractères).'
    }
    if (status === 400 && message.includes('invalid format')) {
      return "Le format de l'adresse email est invalide."
    }

    return `Erreur d'authentification : ${error.message}`
  }

  /**
   * Traitement spécifique des erreurs PostgreSQL (Codes d'erreurs standardisés)
   */
  private static handleDatabaseError(error: any): string {
    switch (error.code) {
      // 23505 : Contrainte d'unicité violée (ex: matricule ou email déjà existant)
      case '23505':
        if (error.message?.includes('matriculeEnseignant')) {
          return "Ce matricule d'enseignant est déjà attribué."
        }
        return 'Une donnée unique existe déjà dans la base de données.'

      // 42501 : Erreur de Row Level Security (RLS)
      case '42501':
        return "Sécurité : Vous n'avez pas l'autorisation d'effectuer cette action."

      // 23503 : Violation de clé étrangère (ex: la classe ou l'ID profil n'existe pas)
      case '23503':
        return "Erreur de liaison : L'entité associée n'existe pas."

      // 22001 : Chaîne de caractères trop longue pour le champ VARCHAR défini
      case '22001':
        return "L'un des champs contient trop de caractères par rapport à la limite autorisée."

      // 42703 : Colonne inexistante (Aide le développeur pendant le dev)
      case '42703':
        return "Erreur technique : Une colonne demandée n'existe pas en base de données."

      default:
        return `Erreur de base de données (${error.code}) : ${error.message}`
    }
  }
}
