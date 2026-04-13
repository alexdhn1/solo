import { apiEnv } from '@/lib/api/env'
import type { ApiResponse, SoloReservationPayload, SoloWeekendSlot } from '@/lib/types'

/**
 * Fetch available solo weekends.
 * GET {url}?action=getSoloWeekends → SoloWeekendSlot[]
 * Already filters out dates blocked by group Reservations.
 */
export async function getSoloWeekends(): Promise<SoloWeekendSlot[]> {
  const url = `${apiEnv.apiUrl}?action=getSoloWeekends`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`GET failed: ${res.status}`)
  return res.json() as Promise<SoloWeekendSlot[]>
}

/**
 * Submit a solo reservation.
 * POST {url} with JSON body → ApiResponse
 * Uses text/plain content-type to avoid CORS preflight with Apps Script.
 */
export async function submitSoloReservation(
  payload: SoloReservationPayload,
): Promise<ApiResponse> {
  const res = await fetch(apiEnv.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`POST failed: ${res.status}`)
  return res.json() as Promise<ApiResponse>
}
