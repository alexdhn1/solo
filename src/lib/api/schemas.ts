import { z } from 'zod'
import { JOURS_OPTIONS } from '@/features/solo-booking/content'

/** One bookable slot, as returned by GET ?action=getSoloWeekends. */
export const soloWeekendSlotSchema = z.object({
  rowIndex: z.number().int().positive(),
  label: z.string().min(1),
  dateDebut: z.string(),
  dateFin: z.string(),
})

export const soloWeekendSlotsSchema = z.array(soloWeekendSlotSchema)

/** Known application-level error codes (contrat inter-lots). */
export const apiErrorCodes = [
  'STALE_SLOT',
  'ALREADY_BOOKED',
  'PAST_SLOT',
  'INVALID_INPUT',
  'CONFLICT_GROUP',
] as const

export type ApiErrorCode = (typeof apiErrorCodes)[number]

/** `{ success, code?, message }` — contrat inter-lots. */
export const apiResponseSchema = z.object({
  success: z.boolean(),
  code: z.string().optional(),
  message: z.string(),
})

/** Payload sent by POST. Carries both `rowIndex` and `label` (contrat inter-lots). */
export const soloReservationPayloadSchema = z.object({
  action: z.literal('soloReservation'),
  rowIndex: z.number().int().positive(),
  label: z.string().min(1),
  nom: z.string().min(1).max(100),
  email: z.string().min(1).max(254),
  message: z.string().max(1000),
  joursChoisis: z.enum(JOURS_OPTIONS),
})
