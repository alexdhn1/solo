import { useState } from 'react'

import type { AvailabilityBlock, WeekSession } from '@/lib/types'

import { WeekSessionEditor } from './components/WeekSessionEditor'
import { WeekSessionTimeline } from './components/WeekSessionTimeline'
import { upsertWeekSession } from './service'

export function WeekSessionFeature() {
  const [sessions, setSessions] = useState<WeekSession[]>([])
  const [blocks] = useState<AvailabilityBlock[]>([])
  const [notice, setNotice] = useState('')

  const onSubmit = async (draft: {
    date: string
    startTime: string
    endTime: string
    guestName: string
    notes: string
  }) => {
    try {
      await upsertWeekSession({ existing: sessions, blocks, draft })
      setSessions((prev) =>
        prev.concat({
          id: `s-${Date.now()}`,
          date: draft.date,
          startTime: draft.startTime,
          endTime: draft.endTime,
          guestName: draft.guestName,
          notes: draft.notes,
          status: 'planned',
        }),
      )
      setNotice('Session semaine enregistree.')
    } catch (error) {
      if (String(error).includes('CONFLICT_SCHEDULE')) {
        setNotice('Conflit de planning detecte.')
      } else {
        setNotice('Impossible d\'enregistrer la session.')
      }
    }
  }

  return (
    <section className="grid gap-4">
      <WeekSessionEditor onSubmit={onSubmit} />
      <WeekSessionTimeline sessions={sessions} />
      {notice ? <p className="rounded-md border px-3 py-2 text-sm">{notice}</p> : null}
    </section>
  )
}
