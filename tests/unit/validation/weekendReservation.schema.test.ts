import { describe, expect, it } from 'vitest'

import { weekendReservationSchema } from '@/lib/validation/sheetsSchemas'

describe('weekendReservationSchema', () => {
  it('accepts a valid reservation payload', () => {
    const result = weekendReservationSchema.safeParse({
      id: 'r-1',
      weekendLabel: '28-29 mars 2026',
      startDate: '2026-03-28',
      endDate: '2026-03-29',
      status: 'reserved',
      guestName: 'Alex',
      guestEmail: 'alex@example.com',
    })

    expect(result.success).toBe(true)
  })

  it('rejects an invalid status', () => {
    const result = weekendReservationSchema.safeParse({
      id: 'r-2',
      weekendLabel: '28-29 mars 2026',
      startDate: '2026-03-28',
      endDate: '2026-03-29',
      status: 'unknown',
    })

    expect(result.success).toBe(false)
  })
})
