import type { AvailabilityBlock, WeekSession, WeekendReservation } from '@/lib/types'

const dateOverlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string): boolean => {
  return !(aEnd < bStart || bEnd < aStart)
}

export const hasWeekendConflict = (
  reservation: Pick<WeekendReservation, 'startDate' | 'endDate'>,
  existing: WeekendReservation[],
  blocks: AvailabilityBlock[],
): boolean => {
  const inReservations = existing.some((item) => {
    return item.status !== 'available' && dateOverlaps(reservation.startDate, reservation.endDate, item.startDate, item.endDate)
  })

  const inBlocks = blocks.some((item) => {
    return dateOverlaps(reservation.startDate, reservation.endDate, item.startDate, item.endDate) && item.category !== 'libre'
  })

  return inReservations || inBlocks
}

export const hasWeekSessionConflict = (
  session: Pick<WeekSession, 'date' | 'startTime' | 'endTime'>,
  existing: WeekSession[],
  blocks: AvailabilityBlock[],
): boolean => {
  const inSessions = existing.some((item) => {
    if (item.date !== session.date || item.status === 'cancelled') return false
    return !(session.endTime <= item.startTime || session.startTime >= item.endTime)
  })

  const inBlocks = blocks.some((item) => {
    return item.startDate <= session.date && session.date <= item.endDate && item.category !== 'libre'
  })

  return inSessions || inBlocks
}
