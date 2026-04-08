import type { WeekSession } from '@/lib/types'

export interface WeekSessionDraft {
  date: string
  startTime: string
  endTime: string
  guestName: string
  notes: string
}

export const createWeekSessionDraft = (): WeekSessionDraft => ({
  date: '',
  startTime: '09:00',
  endTime: '17:00',
  guestName: '',
  notes: '',
})

export const toWeekSessionInput = (
  draft: WeekSessionDraft,
): Partial<WeekSession> & {
  date: string
  startTime: string
  endTime: string
  guestName: string
} => ({
  date: draft.date,
  startTime: draft.startTime,
  endTime: draft.endTime,
  guestName: draft.guestName,
  notes: draft.notes,
})
