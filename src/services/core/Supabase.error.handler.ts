import { toast } from 'sonner'
import type { PostgrestError } from '@supabase/supabase-js'
import { AuthError } from '@supabase/supabase-js'

/**
 * Erreur générique attendue par ce handler quand on ne reconnaît ni une
 * AuthError ni une PostgrestError (ex: TypeError réseau, erreur JS
 * classique, valeur non-Error jetée par un tiers).
 */
type UnknownSupabaseError = AuthError | PostgrestError | Error | unknown

export class SupabaseErrorHandler {
  /**
   * Analyse une erreur Supabase/PostgreSQL/réseau et retourne un message
   * FRANÇAIS, SÛR À AFFICHER À L'UTILISATEUR (jamais de détail interne :
   * nom de colonne, contrainte SQL, stack trace...).
   *
   * IMPORTANT — ce handler déclenche lui-même le toast (comme dans la
   * version d'origine), pour que les services qui n'ont pas de canal
   * pour remonter l'erreur jusqu'à un composant (pas de prop `onError`,
   * pas de retour exploité par l'UI) affichent quand même un message.
   *
   * EN CONTREPARTIE : n'appelle plus `toast.error(...)` toi-même dans un
   * `catch` qui a déjà appelé `SupabaseErrorHandler.handle(error)` —
   * sinon le même message s'affiche deux fois. Si un composant a besoin
   * du message sans le toast (ex: l'afficher sous un champ de
   * formulaire), utilise directement `error.message` sur l'erreur
   * relancée par le service, qui contient déjà ce message nettoyé.
   *
   * Le détail brut de l'erreur est systématiquement loggé (jamais perdu
   * pour le debug), simplement plus jamais montré à l'utilisateur final.
   */
  static handle(error: UnknownSupabaseError): string {
    this.logError(error)

    const cleanMessage = this.resolveMessage(error)

    toast.error(cleanMessage, {
      duration: 5000,
      closeButton: true,
    })

    return cleanMessage
  }

  private static resolveMessage(error: UnknownSupabaseError): string {
    if (this.isAuthError(error)) {
      return this.handleAuthError(error)
    }

    if (this.isPostgrestError(error)) {
      return this.handleDatabaseError(error)
    }

    if (this.isNetworkError(error)) {
      return 'Problème de connexion réseau. Veuillez vérifier votre accès internet.'
    }

    // Fallback : on ne renvoie JAMAIS error.message ici, car on ne sait
    // pas ce qu'il contient (il peut venir de n'importe où — y compris
    // d'une lib tierce qui expose des détails internes).
    return 'Une erreur inattendue est survenue. Veuillez réessayer.'
  }

  /**
   * Log systématique de l'erreur brute pour le debug/monitoring.
   * En développement (Vite) : trace complète dans la console.
   * En production : trace minimale — brancher ici un service de
   * monitoring (Sentry, etc.) plutôt que d'exposer les détails au client.
   */
  private static logError(error: unknown): void {
    if (import.meta.env.DEV) {
      console.error('[SupabaseErrorHandler]', error)
    } else {
      console.error('[SupabaseErrorHandler] Une erreur est survenue.')
      // TODO: envoyer `error` à un service de monitoring (Sentry, etc.)
    }
  }

  private static isAuthError(error: unknown): error is AuthError {
    // instanceof est plus robuste qu'une comparaison de constructor.name,
    // qui peut casser après minification/bundling.
    return error instanceof AuthError
  }

  private static isPostgrestError(error: unknown): error is PostgrestError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error &&
      typeof (error as PostgrestError).code === 'string'
    )
  }

  private static isNetworkError(error: unknown): boolean {
    return (
      error instanceof TypeError ||
      (error instanceof Error && error.message === 'Failed to fetch')
    )
  }

  /**
   * Traitement spécifique des erreurs d'authentification (GoTrue).
   */
  private static handleAuthError(error: AuthError): string {
    const message = error.message?.toLowerCase() ?? ''
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

    if (message.includes('email address') && message.includes('invalid')) {
      return "Cette adresse e-mail n'est pas acceptée. Vérifiez qu'elle est correctement orthographiée."
    }

    if (message.includes('should be at least')) {
      // Le message Supabase contient la vraie longueur minimale configurée
      // sur le projet (ex: "Password should be at least 8 characters.") :
      // on l'extrait au lieu de la coder en dur, pour ne jamais afficher
      // une valeur désynchronisée de la config réelle.
      const match = message.match(/at least (\d+) characters?/)
      const minLength = match?.[1]
      return minLength
        ? `Le mot de passe est trop court (minimum ${minLength} caractères).`
        : 'Le mot de passe est trop court.'
    }

    if (message.includes('should be different from the old password')) {
      return "Le nouveau mot de passe doit être différent de l'actuel."
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

    // Fallback générique : jamais error.message brut à l'utilisateur.
    return "Une erreur d'authentification est survenue. Veuillez réessayer."
  }

  /**
   * Traitement spécifique des erreurs PostgreSQL & PostgREST.
   */
  private static handleDatabaseError(error: PostgrestError): string {
    const code = error.code
    const details = error.details?.toLowerCase() ?? ''
    const message = error.message?.toLowerCase() ?? ''

    switch (code) {
      // 23505: violation de contrainte UNIQUE
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

      // 42501: violation RLS (Row Level Security)
      case '42501':
        return "Droits insuffisants : vous n'avez pas l'autorisation de modifier ou lire ces données."

      // 23503: violation de clé étrangère
      case '23503':
        return "Action impossible : l'élément auquel vous tentez de l'associer n'existe plus."

      // PGRST116: erreur PostgREST fréquente avec .single()
      case 'PGRST116':
        return "Aucun enregistrement, ou plusieurs enregistrements trouvés alors qu'un seul était attendu."

      // 22001: valeur trop longue pour le type (ex: varchar(15))
      case '22001':
        return "L'un des champs contient trop de caractères."

      // 08006 / 57P01: déconnexion serveur ou crash de session réseau
      case '08006':
      case '57P01':
        return 'La connexion avec le serveur a été interrompue. Veuillez rafraîchir la page.'

      // 42703: erreur de code développeur (colonne inexistante)
      case '42703':
        // Erreur de configuration, pas une erreur utilisateur : message
        // volontairement générique, le détail réel est déjà loggé.
        return 'Une erreur technique est survenue. Veuillez réessayer plus tard.'

      default:
        // Jamais error.message brut ici : il peut contenir le nom de
        // colonnes, de tables ou de contraintes internes à la base.
        return 'Une erreur est survenue lors du traitement de votre demande.'
    }
  }
}
