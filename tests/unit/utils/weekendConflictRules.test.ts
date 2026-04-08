import { describe, expect, it } from 'vitest'

import { hasWeekendConflict } from '@/lib/utils/conflictRules'

describe('hasWeekendConflict', () => {
  it('returns false when no overlap exists', () => {
    const result = hasWeekendConflict(
      { startDate: '2026-04-05', endDate: '2026-04-06' },
      [
        {
          id: '1',
          weekendLabel: 'w1',
          startDate: '2026-04-12',
          endDate: '2026-04-13',
          status: 'reserved',
        },
      ],
      [],
    )

    expect(result).toBe(false)
  })

  it('returns true when overlap with reserved weekend exists', () => {
    const result = hasWeekendConflict(
      { startDate: '2026-04-12', endDate: '2026-04-13' },
      [
        {
          id: '1',
          weekendLabel: 'w1',
          startDate: '2026-04-12',
          endDate: '2026-04-13',
          status: 'reserved',
        },
      ],
      [],
    )

    expect(result).toBe(true)
  })
})
