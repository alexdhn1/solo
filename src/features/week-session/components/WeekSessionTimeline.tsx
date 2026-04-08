import type { WeekSession } from '@/lib/types'

interface Props {
  sessions: WeekSession[]
}

export function WeekSessionTimeline({ sessions }: Props) {
  return (
    <section className="rounded-xl border p-4">
      <h3 className="mb-3 text-lg font-semibold">Timeline semaine</h3>
      <ul className="grid gap-2">
        {sessions.map((item) => (
          <li key={item.id} className="rounded-md border px-3 py-2 text-sm">
            {item.date} - {item.startTime} / {item.endTime} ({item.status})
          </li>
        ))}
      </ul>
    </section>
  )
}
