import type { WeekendReservation } from '@/lib/types'

export interface WeekendReservationDraft {
  weekendLabel: string
  guestName: string
  guestEmail: string
  message: string
}

export const createDraft = (): WeekendReservationDraft => ({
  weekendLabel: '',
  guestName: '',
  guestEmail: '',
  message: '',
})

export const toReservationInput = (draft: WeekendReservationDraft): Pick<WeekendReservation, 'weekendLabel' | 'guestName' | 'guestEmail' | 'message'> => ({
  weekendLabel: draft.weekendLabel,
  guestName: draft.guestName,
  guestEmail: draft.guestEmail,
  message: draft.message,
})
