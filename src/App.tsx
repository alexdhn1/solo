import { useEffect, useState } from 'react'

import { PlanningBoard } from '@/features/planning-overview/components/PlanningBoard'
import { PlanningFallbackState } from '@/features/planning-overview/components/PlanningFallbackState'
import { fetchPlanningOverview } from '@/features/planning-overview/service'
import { WeekendBookingFeature } from '@/features/weekend-booking'
import { WeekSessionFeature } from '@/features/week-session'
import type { PlanningViewItem } from '@/features/planning-overview/viewModel'

function App() {
  const [items, setItems] = useState<PlanningViewItem[]>([])
  const [fallback, setFallback] = useState({ isUnavailable: false, userMessage: '' })

  useEffect(() => {
    void fetchPlanningOverview('2026-04-01', '2026-05-01').then((result) => {
      setItems(result.items)
      setFallback(result.fallback)
    })
  }, [])

  return (
    <main className="mx-auto grid max-w-5xl gap-6 p-4 md:p-8">
      <header className="rounded-xl border p-4">
        <h1 className="text-2xl font-bold">Weekend Potes et Teletravail</h1>
        <p className="text-sm opacity-80">
          Organisation personnelle avec Google Sheets comme source de verite.
        </p>
      </header>

      <PlanningFallbackState {...fallback} />
      <PlanningBoard items={items} />
      <WeekendBookingFeature />
      <WeekSessionFeature />
    </main>
  )
}

export default App
