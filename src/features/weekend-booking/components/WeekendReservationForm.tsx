import { useState } from 'react'

import { Button } from '@/components/ui/button'
import type { WeekendReservationDraft } from '@/features/weekend-booking/model'
import { createDraft } from '@/features/weekend-booking/model'

interface Props {
  onSubmit: (draft: WeekendReservationDraft) => Promise<void>
}

export function WeekendReservationForm({ onSubmit }: Props) {
  const [draft, setDraft] = useState<WeekendReservationDraft>(createDraft)
  const [submitting, setSubmitting] = useState(false)

  const update = (key: keyof WeekendReservationDraft, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(draft)
      setDraft(createDraft())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-xl border p-4">
      <h3 className="text-lg font-semibold">Reserver un weekend</h3>
      <input
        className="rounded-md border px-3 py-2"
        placeholder="YYYY-MM-DD|YYYY-MM-DD"
        value={draft.weekendLabel}
        onChange={(e) => update('weekendLabel', e.target.value)}
      />
      <input
        className="rounded-md border px-3 py-2"
        placeholder="Nom du pote"
        value={draft.guestName}
        onChange={(e) => update('guestName', e.target.value)}
      />
      <input
        className="rounded-md border px-3 py-2"
        placeholder="Email"
        value={draft.guestEmail}
        onChange={(e) => update('guestEmail', e.target.value)}
      />
      <textarea
        className="rounded-md border px-3 py-2"
        placeholder="Message"
        value={draft.message}
        onChange={(e) => update('message', e.target.value)}
      />
      <Button disabled={submitting} type="submit">
        {submitting ? 'Reservation...' : 'Confirmer'}
      </Button>
    </form>
  )
}
