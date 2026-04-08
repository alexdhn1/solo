import { describe, expect, it } from 'vitest'

import { buildPlanningViewModel } from '@/features/planning-overview/viewModel'

describe('buildPlanningViewModel', () => {
  it('merges reservations, sessions and blocks into single list', () => {
    const result = buildPlanningViewModel({
      reservations: [
        {
          id: 'r1',
          weekendLabel: 'w1',
          startDate: '2026-04-18',
          endDate: '2026-04-19',
          status: 'reserved',
        },
      ],
      weekSessions: [
        {
          id: 's1',
          date: '2026-04-14',
          startTime: '09:00',
          endTime: '17:00',
          guestName: 'Tom',
          status: 'planned',
        },
      ],
      availabilityBlocks: [
        {
          id: 'b1',
          category: 'vacances',
          person: 'tous',
          startDate: '2026-04-20',
          endDate: '2026-04-21',
        },
      ],
      lastSyncAt: '2026-04-10T10:00:00.000Z',
    })

    expect(result.length).toBe(3)
  })
})
