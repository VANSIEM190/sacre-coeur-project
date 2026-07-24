import { z } from 'zod'

export const emailSchema = z.object({
  email: z
    .string({ error: "L'adresse e-mail est requise." })
    .email('Veuillez entrer une adresse e-mail valide.'),
})

export const passwordSchema = z
  .object({
    newPassword: z
      .string({ error: 'Le mot de passe est requis.' })
      .min(6, 'Le mot de passe doit contenir au moins 6 caractères.'),
    confirmPassword: z.string({
      error: 'La confirmation est requise.',
    }),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  })

export type EmailFormValues = z.infer<typeof emailSchema>
export type PasswordFormValues = z.infer<typeof passwordSchema>
