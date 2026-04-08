import { beforeEach, describe, expect, it, vi } from 'vitest'

import { planningApi } from '@/lib/api/client'

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

describe('planningApi.upsertWeekSession', () => {
  it('creates week session through API', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessionId: 's-1', status: 'planned' }),
    })

    const result = await planningApi.upsertWeekSession({
      date: '2026-04-14',
      startTime: '09:00',
      endTime: '17:00',
      guestName: 'Luca',
      notes: 'coworking',
    })

    expect(result.sessionId).toBe('s-1')
  })

  it('throws on schedule conflict', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ code: 'CONFLICT_SCHEDULE', message: 'Conflict' }),
    })

    await expect(
      planningApi.upsertWeekSession({
        date: '2026-04-14',
        startTime: '09:00',
        endTime: '17:00',
        guestName: 'Luca',
        notes: 'coworking',
      }),
    ).rejects.toThrow('CONFLICT_SCHEDULE')
  })
})
