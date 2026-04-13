import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock env before importing client
vi.mock('@/lib/api/env', () => ({
  apiEnv: { apiUrl: 'https://fake.test/exec' },
}))

import { getSoloWeekends, submitSoloReservation } from '@/lib/api/client'
import type { SoloWeekendSlot } from '@/lib/types'

describe('getSoloWeekends', () => {
  const mockSlots: SoloWeekendSlot[] = [
    { rowIndex: 2, label: 'Ven 25 → Mar 29 avril 2025', dateDebut: '2025-04-25', dateFin: '2025-04-29' },
    { rowIndex: 3, label: 'Ven 2 → Mar 6 mai 2025', dateDebut: '2025-05-02', dateFin: '2025-05-06' },
  ]

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => vi.restoreAllMocks())

  it('calls the correct URL and returns parsed slots', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockSlots), { status: 200 }),
    )

    const result = await getSoloWeekends()

    expect(fetch).toHaveBeenCalledWith('https://fake.test/exec?action=getSoloWeekends')
    expect(result).toEqual(mockSlots)
  })

  it('throws on non-OK response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 500 }))

    await expect(getSoloWeekends()).rejects.toThrow('GET failed: 500')
  })
})

describe('submitSoloReservation', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => vi.restoreAllMocks())

  it('sends POST with text/plain and returns response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, message: 'ok' }), { status: 200 }),
    )

    const payload = {
      action: 'soloReservation' as const,
      rowIndex: 5,
      nom: 'Thomas',
      email: 'thomas@test.com',
      message: 'Salut',
      joursChoisis: 'Vendredi → Dimanche',
    }

    const result = await submitSoloReservation(payload)

    expect(fetch).toHaveBeenCalledWith('https://fake.test/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    })
    expect(result).toEqual({ success: true, message: 'ok' })
  })

  it('throws on non-OK response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 403 }))

    await expect(
      submitSoloReservation({
        action: 'soloReservation',
        rowIndex: 2,
        nom: 'A',
        email: 'a@b.com',
        message: '',
        joursChoisis: 'Samedi → Dimanche',
      }),
    ).rejects.toThrow('POST failed: 403')
  })
})
