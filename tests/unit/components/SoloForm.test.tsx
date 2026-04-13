import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SoloForm } from '@/features/solo-booking/components/SoloForm'
import type { SoloWeekendSlot } from '@/lib/types'

const mockWeekends: SoloWeekendSlot[] = [
  { rowIndex: 2, label: 'Ven 25 → Mar 29 avr', dateDebut: '2025-04-25', dateFin: '2025-04-29' },
  { rowIndex: 3, label: 'Ven 2 → Mar 6 mai', dateDebut: '2025-05-02', dateFin: '2025-05-06' },
]

describe('SoloForm', () => {
  it('renders weekend options', () => {
    render(<SoloForm weekends={mockWeekends} onSubmit={async () => {}} />)

    expect(screen.getByLabelText(/créneau disponible/i)).toBeInTheDocument()
    expect(screen.getByText('Ven 25 → Mar 29 avr')).toBeInTheDocument()
    expect(screen.getByText('Ven 2 → Mar 6 mai')).toBeInTheDocument()
  })

  it('renders jours choisis options', () => {
    render(<SoloForm weekends={mockWeekends} onSubmit={async () => {}} />)

    const joursSelect = screen.getByLabelText(/tu restes quand/i) as HTMLSelectElement
    const options = Array.from(joursSelect.options).map((o) => o.text)
    expect(options).toContain('Vendredi → Dimanche')
    expect(options).toContain('Samedi → Mardi (+ TT lun-mar)')
  })

  it('submit button exists with expected text', () => {
    const { container } = render(<SoloForm weekends={mockWeekends} onSubmit={async () => {}} />)

    const buttons = container.querySelectorAll('button[type="submit"]')
    expect(buttons.length).toBeGreaterThan(0)

    const hasReserveText = Array.from(buttons).some((b) =>
      b.textContent?.includes('réserve'),
    )
    expect(hasReserveText).toBe(true)
  })
})
