import { useState } from 'react'

import { Button } from '@/components/ui/button'
import type { WeekSessionDraft } from '@/features/week-session/model'
import { createWeekSessionDraft } from '@/features/week-session/model'

interface Props {
  onSubmit: (draft: WeekSessionDraft) => Promise<void>
}

export function WeekSessionEditor({ onSubmit }: Props) {
  const [draft, setDraft] = useState(createWeekSessionDraft)

  const update = (key: keyof WeekSessionDraft, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    await onSubmit(draft)
    setDraft(createWeekSessionDraft())
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-xl border p-4">
      <h3 className="text-lg font-semibold">Session teletravail</h3>
      <input className="rounded-md border px-3 py-2" placeholder="YYYY-MM-DD" value={draft.date} onChange={(e) => update('date', e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <input className="rounded-md border px-3 py-2" placeholder="09:00" value={draft.startTime} onChange={(e) => update('startTime', e.target.value)} />
        <input className="rounded-md border px-3 py-2" placeholder="17:00" value={draft.endTime} onChange={(e) => update('endTime', e.target.value)} />
      </div>
      <input className="rounded-md border px-3 py-2" placeholder="Nom du pote" value={draft.guestName} onChange={(e) => update('guestName', e.target.value)} />
      <textarea className="rounded-md border px-3 py-2" placeholder="Notes" value={draft.notes} onChange={(e) => update('notes', e.target.value)} />
      <Button type="submit">Enregistrer</Button>
    </form>
  )
}
