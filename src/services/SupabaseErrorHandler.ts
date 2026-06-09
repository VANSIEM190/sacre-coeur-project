import { AuthError } from '@supabase/supabase-js'
import { toast } from 'sonner' // ou 'react-hot-toast' ou ton composant custom de toast

export class SupabaseErrorHandler {
  /**
   * Analyse une erreur venant de Supabase, affiche un Toast et retourne le message propre.
   */
  static handle(error: any): string {
    let cleanMessage = ''

    // 1. Si l'erreur est une instance d'AuthError (Erreurs d'authentification)
    if (
      error instanceof AuthError ||
      error?.constructor?.name === 'AuthError'
    ) {
      cleanMessage = this.handleAuthError(error)
    }
    // 2. Si c'est une erreur de Base de données (PostgreSQL / RLS / Contraintes)
    else if (error?.code) {
      cleanMessage = this.handleDatabaseError(error)
    }
    // 3. Erreurs réseau ou générales
    else if (error?.message === 'Failed to fetch') {
      cleanMessage =
        'Problème de connexion réseau. Veuillez vérifier votre accès internet.'
    }
    // Message par défaut si l'erreur est inconnue
    else {
      cleanMessage =
        error?.message ||
        'Une erreur inattendue est survenue. Veuillez réessayer.'
    }

    // Déclenchement du Toast visuel unique ici
    toast.error(cleanMessage)

    // On retourne quand même la string pour ne pas casser tes blocs try/catch/throw
    return cleanMessage
  }

  /**
   * Traitement spécifique des erreurs d'authentification (SignUp, Login, etc.)
   */
  private static handleAuthError(error: any): string {
    const status = error.status
    const message = error.message.toLowerCase()

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
      case '23505':
        if (error.message?.includes('matriculeEnseignant')) {
          return "Ce matricule d'enseignant est déjà attribué."
        }
        return 'Une donnée unique existe déjà dans la base de données.'

      case '42501':
        return "Sécurité : Vous n'avez pas l'autorisation d'effectuer cette action."

      case '23503':
        return "Erreur de liaison : L'entité associée n'existe pas."

      case '22001':
        return "L'un des champs contient trop de caractères par rapport à la limite autorisée."

      case '42703':
        return "Erreur technique : Une colonne demandée n'existe pas en base de données."

      default:
        return `Erreur de base de données (${error.code}) : ${error.message}`
    }
  }
}
