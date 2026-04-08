import { beforeEach, describe, expect, it, vi } from 'vitest'

import { planningApi } from '@/lib/api/client'

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

describe('planningApi.reserveWeekend', () => {
  it('returns reservation id on success', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reservationId: 'r-1', status: 'reserved' }),
    })

    const result = await planningApi.reserveWeekend({
      weekendLabel: '28-29 mars 2026',
      guestName: 'Tom',
      guestEmail: 'tom@example.com',
      message: 'weekend potes',
    })

    expect(result.reservationId).toBe('r-1')
  })

  it('throws on API conflict error', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ code: 'CONFLICT_UNAVAILABLE', message: 'Conflict' }),
    })

    await expect(
      planningApi.reserveWeekend({
        weekendLabel: '28-29 mars 2026',
        guestName: 'Tom',
        guestEmail: 'tom@example.com',
        message: 'weekend potes',
      }),
    ).rejects.toThrow('CONFLICT_UNAVAILABLE')
  })
})
