import { z } from 'zod'

export const emailSchema = z.object({
  email: z
    .string({ error: "L'adresse e-mail est requise." })
    .email('Veuillez entrer une adresse e-mail valide.'),
  // Requis par authService.updateEmail(newEmail, currentPassword) :
  // le changement d'email est une opération sensible qui doit être
  // reconfirmée par le mot de passe actuel, pas seulement par la
  // session déjà ouverte.
  currentPassword: z
    .string({ error: 'Le mot de passe actuel est requis.' })
    .min(1, 'Le mot de passe actuel est requis.'),
})

export const passwordSchema = z
  .object({
    // Requis par authService.updatePassword(newPassword, currentPassword).
    currentPassword: z
      .string({ error: 'Le mot de passe actuel est requis.' })
      .min(1, 'Le mot de passe actuel est requis.'),
    newPassword: z
      .string({ error: 'Le mot de passe est requis.' })
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
    confirmPassword: z.string({
      error: 'La confirmation est requise.',
    }),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  })
  .refine(data => data.newPassword !== data.currentPassword, {
    message: "Le nouveau mot de passe doit être différent de l'actuel.",
    path: ['newPassword'],
  })

export type EmailFormValues = z.infer<typeof emailSchema>
export type PasswordFormValues = z.infer<typeof passwordSchema>
