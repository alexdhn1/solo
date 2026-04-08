import { describe, expect, it } from 'vitest'

import { weekSessionSchema } from '@/lib/validation/sheetsSchemas'

describe('weekSessionSchema', () => {
  it('accepts a valid week session', () => {
    const result = weekSessionSchema.safeParse({
      id: 's-1',
      date: '2026-04-14',
      startTime: '09:00',
      endTime: '17:00',
      guestName: 'Max',
      status: 'planned',
    })

    expect(result.success).toBe(true)
  })

  it('rejects session with invalid time range', () => {
    const result = weekSessionSchema.safeParse({
      id: 's-2',
      date: '2026-04-14',
      startTime: '18:00',
      endTime: '09:00',
      guestName: 'Max',
      status: 'planned',
    })

    expect(result.success).toBe(false)
  })
})
