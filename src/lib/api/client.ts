import { apiEnv } from '@/lib/api/env'
import type { ApiErrorPayload, PlanningPayload, WeekSession, WeekendReservation } from '@/lib/types'

const buildHeaders = (): HeadersInit => ({
  'Content-Type': 'text/plain;charset=utf-8',
})

const request = async <T>(body: Record<string, unknown>): Promise<T> => {
  const response = await fetch(apiEnv.apiUrl, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  })

  const json = (await response.json()) as T | ApiErrorPayload
  if (!response.ok) {
    const payload = json as ApiErrorPayload
    throw new Error(`${payload.code}: ${payload.message}`)
  }

  return json as T
}

export const planningApi = {
  getPlanning(fromDate: string, toDate: string) {
    return request<PlanningPayload>({ action: 'getPlanning', fromDate, toDate })
  },
  reserveWeekend(input: Pick<WeekendReservation, 'weekendLabel' | 'guestName' | 'guestEmail' | 'message'>) {
    return request<{ reservationId: string; status: 'reserved' }>({ action: 'reserveWeekend', ...input })
  },
  upsertWeekSession(input: Partial<WeekSession> & { date: string; startTime: string; endTime: string; guestName: string }) {
    return request<{ sessionId: string; status: 'planned' | 'confirmed' }>({ action: 'upsertWeekSession', ...input })
  },
}
