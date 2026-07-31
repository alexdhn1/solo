import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../msw/server'
import { API_URL, slots } from '../../msw/handlers'
import { getSoloWeekends, submitSoloReservation } from '@/lib/api/client'
import type { SoloReservationPayload } from '@/lib/types'

const payload: SoloReservationPayload = {
  action: 'soloReservation',
  rowIndex: 5,
  label: 'Ven 25 → Mar 29 avr',
  nom: 'Thomas',
  email: 'thomas@test.com',
  message: 'Salut',
  joursChoisis: 'Vendredi → Dimanche',
}

describe('getSoloWeekends', () => {
  it('calls the correct URL and returns zod-parsed slots', async () => {
    let seenUrl = ''
    server.use(
      http.get(API_URL, ({ request }) => {
        seenUrl = request.url
        return HttpResponse.json(slots)
      }),
    )

    await expect(getSoloWeekends()).resolves.toEqual(slots)
    expect(seenUrl).toBe(`${API_URL}?action=getSoloWeekends`)
  })

  it('retries once and succeeds on the second attempt', async () => {
    let calls = 0
    server.use(
      http.get(API_URL, () => {
        calls += 1
        return calls === 1 ? new HttpResponse(null, { status: 500 }) : HttpResponse.json(slots)
      }),
    )

    await expect(getSoloWeekends()).resolves.toEqual(slots)
    expect(calls).toBe(2)
  })

  it('throws after the retry when the server keeps failing', async () => {
    let calls = 0
    server.use(
      http.get(API_URL, () => {
        calls += 1
        return new HttpResponse(null, { status: 500 })
      }),
    )

    await expect(getSoloWeekends()).rejects.toThrow('GET failed: 500')
    expect(calls).toBe(2)
  })

  it('rejects a payload that does not match the schema (parse, not cast)', async () => {
    server.use(http.get(API_URL, () => HttpResponse.json([{ rowIndex: 'nope' }])))

    await expect(getSoloWeekends()).rejects.toThrow()
  })

  it('aborts immediately when the caller signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(getSoloWeekends(controller.signal)).rejects.toThrow()
  })
})

describe('submitSoloReservation', () => {
  it('POSTs text/plain and returns the parsed response', async () => {
    let body: unknown
    let contentType: string | null = null
    server.use(
      http.post(API_URL, async ({ request }) => {
        contentType = request.headers.get('content-type')
        body = JSON.parse(await request.text())
        return HttpResponse.json({ success: true, message: 'ok' })
      }),
    )

    await expect(submitSoloReservation(payload)).resolves.toEqual({ success: true, message: 'ok' })
    expect(contentType).toBe('text/plain;charset=utf-8')
    expect(body).toEqual(payload)
  })

  it('keeps the optional error code of the contract', async () => {
    server.use(
      http.post(API_URL, () =>
        HttpResponse.json({ success: false, code: 'STALE_SLOT', message: 'changé' }),
      ),
    )

    await expect(submitSoloReservation(payload)).resolves.toEqual({
      success: false,
      code: 'STALE_SLOT',
      message: 'changé',
    })
  })

  it('throws on non-OK response and does not retry', async () => {
    let calls = 0
    server.use(
      http.post(API_URL, () => {
        calls += 1
        return new HttpResponse(null, { status: 403 })
      }),
    )

    await expect(submitSoloReservation(payload)).rejects.toThrow('POST failed: 403')
    expect(calls).toBe(1)
  })

  it('rejects a malformed response body', async () => {
    server.use(http.post(API_URL, () => HttpResponse.json({ nope: true })))

    await expect(submitSoloReservation(payload)).rejects.toThrow()
  })
})
