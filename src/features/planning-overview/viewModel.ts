import type { PlanningPayload } from '@/lib/types'

export interface PlanningViewItem {
  id: string
  itemType: 'weekend_reservation' | 'week_session' | 'availability_block'
  title: string
  startDateTime: string
  endDateTime: string
  availability: 'free' | 'busy' | 'blocked'
  conflictFlag: boolean
}

const reservationAvailability = (status: string): PlanningViewItem['availability'] => {
  if (status === 'available') return 'free'
  if (status === 'reserved') return 'busy'
  return 'blocked'
}

const sessionAvailability = (status: string): PlanningViewItem['availability'] => {
  return status === 'cancelled' ? 'free' : 'busy'
}

const blockAvailability = (category: string): PlanningViewItem['availability'] => {
  return category === 'libre' ? 'free' : 'blocked'
}

export const buildPlanningViewModel = (payload: PlanningPayload): PlanningViewItem[] => {
  const fromReservations = payload.reservations.map((item) => ({
    id: item.id,
    itemType: 'weekend_reservation' as const,
    title: item.weekendLabel,
    startDateTime: item.startDate,
    endDateTime: item.endDate,
    availability: reservationAvailability(item.status),
    conflictFlag: false,
  }))

  const fromSessions = payload.weekSessions.map((item) => ({
    id: item.id,
    itemType: 'week_session' as const,
    title: `Session ${item.guestName}`,
    startDateTime: `${item.date}T${item.startTime}:00`,
    endDateTime: `${item.date}T${item.endTime}:00`,
    availability: sessionAvailability(item.status),
    conflictFlag: false,
  }))

  const fromBlocks = payload.availabilityBlocks.map((item) => ({
    id: item.id,
    itemType: 'availability_block' as const,
    title: `${item.category} (${item.person})`,
    startDateTime: item.startDate,
    endDateTime: item.endDate,
    availability: blockAvailability(item.category),
    conflictFlag: false,
  }))

  return [...fromReservations, ...fromSessions, ...fromBlocks].sort((a, b) =>
    a.startDateTime.localeCompare(b.startDateTime),
  )
}
