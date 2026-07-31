import { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { SoloForm } from '@/features/solo-booking/components/SoloForm'
import type { SoloReservationPayload, SoloWeekendSlot } from '@/lib/types'

const mockWeekends: SoloWeekendSlot[] = [
  { rowIndex: 2, label: 'Ven 25 → Mar 29 avr', dateDebut: '2026-04-25', dateFin: '2026-04-29' },
  { rowIndex: 3, label: 'Ven 2 → Mar 6 mai', dateDebut: '2026-05-02', dateFin: '2026-05-06' },
]

/** The selection lives in the parent (C2) — this harness plays that role. */
function Harness({
  weekends = mockWeekends,
  onSubmit,
}: {
  weekends?: SoloWeekendSlot[]
  onSubmit: (payload: SoloReservationPayload) => Promise<void>
}) {
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  return (
    <SoloForm
      weekends={weekends}
      selectedRow={selectedRow}
      onSelectRow={setSelectedRow}
      onSubmit={onSubmit}
      submitting={false}
    />
  )
}

const noop = async () => {}

describe('SoloForm', () => {
  it('renders weekend options', () => {
    render(<Harness onSubmit={noop} />)

    expect(screen.getByLabelText(/créneau disponible/i)).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Ven 25 → Mar 29 avr' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Ven 2 → Mar 6 mai' })).toBeInTheDocument()
  })

  it('renders jours choisis options', () => {
    render(<Harness onSubmit={noop} />)

    const joursSelect = screen.getByLabelText<HTMLSelectElement>(/tu restes quand/i)
    const options = Array.from(joursSelect.options).map((o) => o.text)
    expect(options).toContain('Vendredi → Dimanche')
    expect(options).toContain('Samedi → Mardi (+ TT lun-mar)')
  })

  it('keeps the submit button disabled until a slot is picked', async () => {
    const user = userEvent.setup()
    render(<Harness onSubmit={noop} />)

    const submit = screen.getByRole('button', { name: /je réserve/i })
    expect(submit).toBeDisabled()

    await user.selectOptions(screen.getByLabelText(/créneau disponible/i), '2')
    expect(submit).toBeEnabled()
  })

  it('submits a payload carrying both rowIndex and label', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<(payload: SoloReservationPayload) => Promise<void>>(async () => {})
    render(<Harness onSubmit={onSubmit} />)

    await user.selectOptions(screen.getByLabelText(/créneau disponible/i), '3')
    await user.selectOptions(screen.getByLabelText(/tu restes quand/i), 'Samedi → Dimanche')
    await user.type(screen.getByLabelText(/ton prénom/i), '  Thomas  ')
    await user.type(screen.getByLabelText(/ton email/i), 'thomas@exemple.com')
    await user.type(screen.getByLabelText(/un petit mot/i), "J'apporte du fromage")
    await user.click(screen.getByRole('button', { name: /je réserve/i }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith({
      action: 'soloReservation',
      rowIndex: 3,
      label: 'Ven 2 → Mar 6 mai',
      nom: 'Thomas',
      email: 'thomas@exemple.com',
      message: "J'apporte du fromage",
      joursChoisis: 'Samedi → Dimanche',
    })
  })

  it('shows an applicative error instead of submitting an invalid email', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<(payload: SoloReservationPayload) => Promise<void>>(async () => {})
    render(<Harness onSubmit={onSubmit} />)

    await user.selectOptions(screen.getByLabelText(/créneau disponible/i), '2')
    await user.type(screen.getByLabelText(/ton prénom/i), 'Thomas')
    await user.type(screen.getByLabelText(/ton email/i), 'pas-un-email')
    await user.click(screen.getByRole('button', { name: /je réserve/i }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(await screen.findByText(/email valide/i)).toBeInTheDocument()
  })

  it('drops a selection whose slot disappeared from the refreshed list (option fantôme)', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <SoloForm
        weekends={mockWeekends}
        selectedRow={3}
        onSelectRow={() => {}}
        onSubmit={noop}
        submitting={false}
      />,
    )

    expect(screen.getByLabelText<HTMLSelectElement>(/créneau disponible/i).value).toBe('3')

    // The backend answered STALE_SLOT and the refreshed list no longer has row 3.
    rerender(
      <SoloForm
        weekends={[mockWeekends[0]!]}
        selectedRow={3}
        onSelectRow={() => {}}
        onSubmit={noop}
        submitting={false}
      />,
    )

    expect(screen.getByLabelText<HTMLSelectElement>(/créneau disponible/i).value).toBe('')
    expect(screen.getByRole('button', { name: /je réserve/i })).toBeDisabled()
    expect(screen.queryByRole('option', { name: 'Ven 2 → Mar 6 mai' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /je réserve/i }))
  })

  it('has no axe violations', async () => {
    const { container } = render(<Harness onSubmit={noop} />)

    const results = await axe(container)
    expect(results.violations).toEqual([])
  })
})
