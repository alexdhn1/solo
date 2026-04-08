import type { PlanningViewItem } from '@/features/planning-overview/viewModel'

interface Props {
  items: PlanningViewItem[]
}

export function PlanningBoard({ items }: Props) {
  return (
    <section className="rounded-xl border p-4">
      <h3 className="mb-3 text-lg font-semibold">Planning consolide</h3>
      <ul className="grid gap-2">
        {items.map((item) => (
          <li key={item.id} className="rounded-md border px-3 py-2 text-sm">
            <div className="font-medium">{item.title}</div>
            <div className="opacity-75">{item.startDateTime} → {item.endDateTime}</div>
            <div className="opacity-75">Disponibilite: {item.availability}</div>
          </li>
        ))}
      </ul>
    </section>
  )
}
