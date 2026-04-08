import { beforeEach, describe, expect, it, vi } from 'vitest'

import { planningApi } from '@/lib/api/client'

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

describe('planningApi.getPlanning', () => {
  it('returns consolidated planning payload', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        reservations: [],
        weekSessions: [],
        availabilityBlocks: [],
        lastSyncAt: '2026-04-10T10:00:00.000Z',
      }),
    })

    const result = await planningApi.getPlanning('2026-04-01', '2026-04-30')
    expect(result.lastSyncAt).toContain('2026')
  })

  it('throws when source is unavailable', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ code: 'SHEET_UNAVAILABLE', message: 'Down' }),
    })

    await expect(planningApi.getPlanning('2026-04-01', '2026-04-30')).rejects.toThrow('SHEET_UNAVAILABLE')
  })
})
