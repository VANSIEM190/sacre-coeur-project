import { supabase } from "../../supabase/supabaseClient";

export class SettingsService {
  async isReenrollmentOpen(): Promise<boolean> {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "reenrollment_enabled")
      .maybeSingle();
    if (error) throw error;
    return data?.value === true || data?.value === "true";
  }

  async setReenrollmentStatus(enabled: boolean): Promise<boolean> {
    const { error } = await supabase.from("system_settings").upsert({
      key: "reenrollment_enabled",
      value: JSON.stringify(enabled),
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  }
}

export const settingsService = new SettingsService();
