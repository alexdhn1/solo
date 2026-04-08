import { describe, expect, it } from 'vitest'

import { hasWeekSessionConflict } from '@/lib/utils/conflictRules'

describe('hasWeekSessionConflict', () => {
  it('returns false when session does not overlap', () => {
    const result = hasWeekSessionConflict(
      { date: '2026-04-14', startTime: '09:00', endTime: '10:00' },
      [
        {
          id: 's-1',
          date: '2026-04-14',
          startTime: '11:00',
          endTime: '12:00',
          guestName: 'Tom',
          status: 'planned',
        },
      ],
      [],
    )

    expect(result).toBe(false)
  })

  it('returns true when overlapping with existing session', () => {
    const result = hasWeekSessionConflict(
      { date: '2026-04-14', startTime: '09:00', endTime: '11:30' },
      [
        {
          id: 's-1',
          date: '2026-04-14',
          startTime: '11:00',
          endTime: '12:00',
          guestName: 'Tom',
          status: 'planned',
        },
      ],
      [],
    )

    expect(result).toBe(true)
  })
})
