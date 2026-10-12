
import { DomainError } from '@sacre-coeur/domain/errors'
import { AuthError, type PostgrestError } from '@supabase/supabase-js'

function isDatabaseError(error: unknown): error is PostgrestError {
  return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
}

/** Traduction pure : les services ne déclenchent aucun toast. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof DomainError) return error.message
  if (error instanceof AuthError) {
    const message = error.message.toLowerCase()
    if (message.includes('invalid login credentials')) return 'Email ou mot de passe incorrect.'
    if (message.includes('already been registered') || message.includes('user already exists')) return 'Cette adresse email est déjà associée à un compte.'
    if (error.status === 429) return 'Trop de tentatives. Veuillez patienter quelques minutes.'
    if (message.includes('email not confirmed')) return 'Veuillez confirmer votre adresse e-mail avant de vous connecter.'
    if (message.includes('should be at least')) {
      const length = message.match(/at least (\d+) characters?/)?.[1]
      return length ? 'Le mot de passe est trop court (minimum ' + length + ' caractères).' : 'Le mot de passe est trop court.'
    }
    return "Une erreur d'authentification est survenue. Veuillez réessayer."
  }
  if (isDatabaseError(error)) {
    switch (error.code) {
      case '23505': return 'Cette donnée existe déjà dans le système.'
      case '42501': return "Vous n'avez pas l'autorisation d'accéder à ces données."
      case '23503': return 'Cette opération est impossible : des données associées sont absentes ou encore utilisées.'
      case 'PGRST116': return 'Aucun enregistrement unique ne correspond à cette demande.'
      case '22001': return "L'un des champs contient trop de caractères."
      case '08006':
      case '57P01': return 'La connexion avec le serveur a été interrompue.'
      default: return 'Une erreur est survenue lors du traitement de votre demande.'
    }
  }
  if (error instanceof TypeError || (error instanceof Error && error.message === 'Failed to fetch')) {
    return 'Problème de connexion réseau. Veuillez vérifier votre accès internet.'
  }
  if (error instanceof Error) {
    if (error.cause) return getErrorMessage(error.cause)
    return error.message || 'Une erreur inattendue est survenue. Veuillez réessayer.'
  }
  return 'Une erreur inattendue est survenue. Veuillez réessayer.'
}

/** Compatibilité des imports historiques ; affichage réservé au package d'interface. */
export class SupabaseErrorHandler {
  static handle(error: unknown): string { return getErrorMessage(error) }
}
