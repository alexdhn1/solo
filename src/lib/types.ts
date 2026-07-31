import type { z } from 'zod'
import type {
  apiResponseSchema,
  soloReservationPayloadSchema,
  soloWeekendSlotSchema,
} from '@/lib/api/schemas'

/** Solo weekend slot returned by GET ?action=getSoloWeekends */
export type SoloWeekendSlot = z.infer<typeof soloWeekendSlotSchema>

/** Solo reservation form data sent via POST (rowIndex + label, cf. contrat inter-lots) */
export type SoloReservationPayload = z.infer<typeof soloReservationPayloadSchema>

/** Response from the Apps Script POST: `{ success, code?, message }` */
export type ApiResponse = z.infer<typeof apiResponseSchema>

export type { ApiErrorCode } from '@/lib/api/schemas'
