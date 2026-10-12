import { toast } from 'sonner'
import { SupabaseErrorHandler as DataErrorHandler } from '@sacre-coeur/data-access/services/core/Supabase.error.handler'

/** Presentation adapter: data services never trigger UI notifications. */
export class SupabaseErrorHandler {
  static handle(error: unknown): string {
    const message = DataErrorHandler.handle(error)
    toast.error(message)
    return message
  }
}

