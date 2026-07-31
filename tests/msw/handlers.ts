import { http, HttpResponse } from 'msw'
import type { SoloWeekendSlot } from '@/lib/types'

/** Must match `test.env.VITE_APPS_SCRIPT_URL` in vitest.config.ts. */
export const API_URL = 'https://api.test/exec'

export const slots: SoloWeekendSlot[] = [
  {
    rowIndex: 2,
    label: 'Ven 25 → Mar 29 avr',
    dateDebut: '2026-04-25',
    dateFin: '2026-04-29',
  },
  {
    rowIndex: 3,
    label: 'Ven 2 → Mar 6 mai',
    dateDebut: '2026-05-02',
    dateFin: '2026-05-06',
  },
]

export const listSlots = (payload: SoloWeekendSlot[] = slots) =>
  http.get(API_URL, () => HttpResponse.json(payload))

export const listSlotsFails = (status = 500) =>
  http.get(API_URL, () => new HttpResponse(null, { status }))

export const bookSucceeds = (message = 'Réservation confirmée, à très vite 🎉') =>
  http.post(API_URL, () => HttpResponse.json({ success: true, message }))

export const bookFails = (code = 'STALE_SLOT', message = 'Ce créneau a changé, recharge la page.') =>
  http.post(API_URL, () => HttpResponse.json({ success: false, code, message }))
