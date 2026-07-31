import { apiEnv } from '@/lib/api/env'
import { apiResponseSchema, soloWeekendSlotsSchema } from '@/lib/api/schemas'
import type { ApiResponse, SoloReservationPayload, SoloWeekendSlot } from '@/lib/types'

/** Hard ceiling for any single request (C7). */
export const REQUEST_TIMEOUT_MS = 15_000

/** Number of extra attempts for the (idempotent) GET (C7). */
const GET_RETRIES = 1

/**
 * Combine the caller's abort signal with a 15s timeout.
 * Falls back gracefully when the environment lacks `AbortSignal.any` / `.timeout`.
 */
function requestSignal(external?: AbortSignal): AbortSignal | undefined {
  const timeout =
    typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(REQUEST_TIMEOUT_MS) : undefined
  if (!timeout) return external
  if (!external) return timeout
  if (typeof AbortSignal.any === 'function') return AbortSignal.any([external, timeout])
  return external
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

/**
 * Fetch available solo weekends.
 * GET {url}?action=getSoloWeekends → SoloWeekendSlot[] (validated with zod, not cast)
 * Already filters out dates blocked by group Reservations.
 * Retries once on network/HTTP failure; never retries a caller-triggered abort.
 */
export async function getSoloWeekends(signal?: AbortSignal): Promise<SoloWeekendSlot[]> {
  const url = `${apiEnv.apiUrl}?action=getSoloWeekends`
  let lastError: unknown = new Error('GET failed')

  for (let attempt = 0; attempt <= GET_RETRIES; attempt++) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    try {
      const res = await fetch(url, { signal: requestSignal(signal) })
      if (!res.ok) throw new Error(`GET failed: ${res.status}`)
      return soloWeekendSlotsSchema.parse(await res.json())
    } catch (error) {
      if (signal?.aborted) throw error
      lastError = error
    }
  }

  throw lastError
}

/**
 * Submit a solo reservation.
 * POST {url} with JSON body → ApiResponse (validated with zod, not cast)
 * Uses text/plain content-type to avoid CORS preflight with Apps Script.
 * Not retried: the request is not idempotent.
 */
export async function submitSoloReservation(
  payload: SoloReservationPayload,
  signal?: AbortSignal,
): Promise<ApiResponse> {
  const res = await fetch(apiEnv.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    signal: requestSignal(signal),
  })
  if (!res.ok) throw new Error(`POST failed: ${res.status}`)
  return apiResponseSchema.parse(await res.json())
}
