import type { AvailabilityBlock, WeekSession, WeekendReservation } from '@/lib/types'
import {
  availabilityBlockSchema,
  weekSessionSchema,
  weekendReservationSchema,
} from '@/lib/validation/sheetsSchemas'

const toIsoDate = (value: string): string => {
  // Accept DD/MM/YYYY and pass-through YYYY-MM-DD.
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [dd, mm, yyyy] = value.split('/')
    return `${yyyy}-${mm}-${dd}`
  }
  return value
}

export const mapReservationRow = (row: Record<string, string>, index: number): WeekendReservation | null => {
  const candidate = {
    id: `${row.A || 'row'}-${index}`,
    weekendLabel: row.A ?? '',
    startDate: toIsoDate(row.B ?? ''),
    endDate: toIsoDate(row.C ?? ''),
    status: (row.D ?? '').toLowerCase() === 'reservé' ? 'reserved' : (row.D ?? '').toLowerCase() === 'disponible' ? 'available' : 'blocked',
    guestName: row.E ?? undefined,
    guestEmail: row.F ?? undefined,
    message: row.G ?? undefined,
    reservedAt: row.H ?? undefined,
    sourceRowRef: `Reservations:${index}`,
  }

  const parsed = weekendReservationSchema.safeParse(candidate)
  return parsed.success ? parsed.data : null
}

export const mapVacancesRow = (row: Record<string, string>): AvailabilityBlock | null => {
  const candidate = {
    id: row.A ?? '',
    startDate: toIsoDate(row.B ?? ''),
    endDate: toIsoDate(row.C ?? ''),
    category: (row.D ?? '').toLowerCase() as AvailabilityBlock['category'],
    person: (row.E ?? '').toLowerCase() as AvailabilityBlock['person'],
    note: row.F ?? undefined,
  }

  const parsed = availabilityBlockSchema.safeParse(candidate)
  return parsed.success ? parsed.data : null
}

export const mapWeekSession = (payload: unknown): WeekSession | null => {
  const parsed = weekSessionSchema.safeParse(payload)
  return parsed.success ? parsed.data : null
}
