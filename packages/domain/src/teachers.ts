import { z } from "zod";

export const createTeacherSchema = z.object({
  fullName: z.string().trim().min(1, "Le nom complet est requis.").max(80),
  email: z.string().trim().email("Email invalide."),
  assignedclasses: z
    .array(z.string().uuid("Identifiant de classe invalide."))
    .min(1, "Attribuez au moins une classe au professeur."),
});

export type RegisterTeacherInput = z.infer<typeof createTeacherSchema>;

/** The current Supabase schema stores assigned class IDs in a text column. */
export function parseAssignedClassIds(value: unknown): string[] {
  if (Array.isArray(value))
    return value.filter((item): item is string => typeof item === "string");
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed))
      return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    // Read legacy comma-separated assignments as well as the JSON format.
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function serializeAssignedClassIds(value: readonly string[]): string {
  return JSON.stringify([...new Set(value)]);
}
