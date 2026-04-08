import type { WeekendReservation } from '@/lib/types'

interface Props {
  reservations: WeekendReservation[]
}

export function WeekendAvailabilityList({ reservations }: Props) {
  return (
    <section className="rounded-xl border p-4">
      <h3 className="mb-3 text-lg font-semibold">Disponibilites weekend</h3>
      <ul className="grid gap-2">
        {reservations.map((item) => (
          <li key={item.id} className="rounded-md border px-3 py-2">
            <div className="font-medium">{item.weekendLabel}</div>
            <div className="text-sm opacity-75">Statut: {item.status}</div>
          </li>
        ))}
      </ul>
    </section>
  )
}
