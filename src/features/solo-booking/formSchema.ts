import { z } from 'zod'
import { JOURS_OPTIONS } from '@/features/solo-booking/content'

/**
 * Client-side validation of the booking form (C5).
 * Mirrors the server-side limits of `submitSoloReservation` (B3) so the user
 * gets an applicative message instead of a rejected request.
 */
export const soloFormSchema = z.object({
  rowIndex: z
    .number({ error: 'Choisis un créneau dans la liste.' })
    .int()
    .positive('Choisis un créneau dans la liste.'),
  label: z.string().min(1, 'Choisis un créneau dans la liste.'),
  nom: z
    .string()
    .trim()
    .min(2, 'Indique au moins 2 caractères pour ton nom.')
    .max(100, 'Ton nom ne peut pas dépasser 100 caractères.'),
  email: z
    .string()
    .trim()
    .min(1, 'Indique ton email.')
    .max(254, "L'email ne peut pas dépasser 254 caractères.")
    .pipe(z.email('Cet email ne ressemble pas à un email valide.')),
  message: z.string().trim().max(1000, 'Le message ne peut pas dépasser 1000 caractères.'),
  joursChoisis: z.enum(JOURS_OPTIONS, { error: 'Choisis une durée de séjour valide.' }),
})

export type SoloFormValues = z.infer<typeof soloFormSchema>

/** First error message of a failed parse, ready to show to the user. */
export function firstErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Formulaire invalide.'
}
