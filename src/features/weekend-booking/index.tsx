import { useMemo, useState } from 'react'

import type { AvailabilityBlock, WeekendReservation } from '@/lib/types'

import { WeekendAvailabilityList } from './components/WeekendAvailabilityList'
import { WeekendReservationForm } from './components/WeekendReservationForm'
import { feedbackMessage } from './feedback'
import { reserveWeekend } from './service'

const initialReservations: WeekendReservation[] = [
  {
    id: 'r-available-1',
    weekendLabel: '2026-04-18|2026-04-19',
    startDate: '2026-04-18',
    endDate: '2026-04-19',
    status: 'available',
  },
]

const initialBlocks: AvailabilityBlock[] = []

export function WeekendBookingFeature() {
  const [reservations, setReservations] = useState<WeekendReservation[]>(initialReservations)
  const [blocks] = useState<AvailabilityBlock[]>(initialBlocks)
  const [notice, setNotice] = useState('')

  const availableReservations = useMemo(
    () => reservations.filter((item) => item.status === 'available'),
    [reservations],
  )

  const onSubmit = async (draft: { weekendLabel: string; guestName: string; guestEmail: string; message: string }) => {
    try {
      await reserveWeekend({ existing: reservations, blocks, draft })
      const [startDate = '', endDate = ''] = draft.weekendLabel.split('|')
      setReservations((prev) =>
        prev.concat({
          id: `r-${Date.now()}`,
          weekendLabel: draft.weekendLabel,
          startDate,
          endDate,
          status: 'reserved',
          guestName: draft.guestName,
          guestEmail: draft.guestEmail,
          message: draft.message,
        }),
      )
      setNotice(feedbackMessage())
    } catch (error) {
      setNotice(feedbackMessage(error))
    }
  }

  return (
    <section className="grid gap-4">
      <WeekendReservationForm onSubmit={onSubmit} />
      <WeekendAvailabilityList reservations={availableReservations} />
      {notice ? <p className="rounded-md border px-3 py-2 text-sm">{notice}</p> : null}
    </section>
  )
}
