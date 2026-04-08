export type ReservationStatus = 'available' | 'reserved' | 'blocked'

export interface WeekendReservation {
  id: string
  weekendLabel: string
  startDate: string
  endDate: string
  status: ReservationStatus
  guestName?: string
  guestEmail?: string
  message?: string
  reservedAt?: string
  sourceRowRef?: string
}

export interface WeekSession {
  id: string
  date: string
  startTime: string
  endTime: string
  guestName: string
  notes?: string
  status: 'planned' | 'confirmed' | 'cancelled'
  createdAt?: string
}

export interface AvailabilityBlock {
  id: string
  category: 'libre' | 'alex' | 'jenna' | 'invites' | 'vacances' | 'pont'
  person: 'alex' | 'jenna' | 'tous'
  startDate: string
  endDate: string
  note?: string
}

export interface PlanningPayload {
  reservations: WeekendReservation[]
  weekSessions: WeekSession[]
  availabilityBlocks: AvailabilityBlock[]
  lastSyncAt: string
}

export interface ApiErrorPayload {
  code: string
  message: string
}
