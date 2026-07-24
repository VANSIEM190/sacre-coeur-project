import { z } from 'zod'

/**
 * Helper utilitaire générique pour intégrer un schéma Zod dans Formik.
 *
 * @param schema Le schéma Zod à valider
 * @param options Configuration optionnelle (ex: debug log)
 */
export const validateWithZod =
  <T>(schema: z.ZodSchema<T>, options?: { debug?: boolean }) =>
  (values: unknown): Record<string, string> => {
    const result = schema.safeParse(values)

    if (result.success) return {}

    const errors: Record<string, string> = {}

    for (const issue of result.error.issues) {
      const key = issue.path.join('.')
      if (!errors[key]) {
        errors[key] = issue.message
      }
    }

    if (options?.debug) {
      console.log('Erreurs de validation Formik/Zod :', errors)
    }

    return errors
  }
