import { supabase } from '@/supabase/supabaseClient'

export class SettingsService {
  /**
   * Vérifie si les réinscriptions sont ouvertes (accessible par tout le monde)
   */
  async isReenrollmentOpen(): Promise<boolean> {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'reenrollment_enabled')
      .single()

    if (error || !data) return false

    return data.value === true || data.value === 'true'
  }

  /**
   * Active ou désactive la réinscription (Réservé à l'Admin)
   */
  async setReenrollmentStatus(enabled: boolean): Promise<boolean> {
    const { error } = await supabase.from('system_settings').upsert({
      key: 'reenrollment_enabled',
      value: JSON.stringify(enabled),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error('[SettingsService.setReenrollmentStatus]:', error.message)
      throw new Error("Impossible de modifier l'état des réinscriptions.")
    }

    return true
  }
}

export const settingsService = new SettingsService()
