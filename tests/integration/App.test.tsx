import { describe, it, expect } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { axe } from 'vitest-axe'
import App from '@/App'
import { server } from '../msw/server'
import { API_URL, bookFails, bookSucceeds, listSlots, listSlotsFails, slots } from '../msw/handlers'

async function fillForm(user: ReturnType<typeof userEvent.setup>, optionValue: string) {
  await user.selectOptions(screen.getByLabelText(/créneau disponible/i), optionValue)
  await user.type(screen.getByLabelText(/ton prénom/i), 'Thomas')
  await user.type(screen.getByLabelText(/ton email/i), 'thomas@exemple.com')
  await user.click(screen.getByRole('button', { name: /je réserve/i }))
}

describe('App', () => {
  it('shows a loading state while the slots are being fetched', () => {
    server.use(listSlots())
    render(<App />)

    expect(screen.getByText(/on verifie les dates disponibles/i)).toBeInTheDocument()
  })

  it('shows an error banner and a retry button when the fetch fails', async () => {
    const user = userEvent.setup()
    server.use(listSlotsFails())
    render(<App />)

    expect(await screen.findByText(/impossible de charger les créneaux/i)).toBeInTheDocument()

    // The retry succeeds this time.
    server.use(listSlots())
    await user.click(screen.getByRole('button', { name: /réessayer/i }))

    expect(await screen.findByLabelText(/créneau disponible/i)).toBeInTheDocument()
  })

  it('shows an empty state when there is no slot left', async () => {
    server.use(listSlots([]))
    render(<App />)

    expect(await screen.findByText(/aucun week-end disponible/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/créneau disponible/i)).not.toBeInTheDocument()
  })

  it('books a slot, confirms it and drops it from the list', async () => {
    const user = userEvent.setup()
    let posted: unknown
    server.use(
      listSlots(),
      http.post(API_URL, async ({ request }) => {
        posted = JSON.parse(await request.text())
        return HttpResponse.json({ success: true, message: 'Réservation confirmée 🎉' })
      }),
    )
    render(<App />)

    await screen.findByLabelText(/créneau disponible/i)
    await fillForm(user, '2')

    expect(await screen.findByText(/réservation confirmée/i)).toBeInTheDocument()
    expect(posted).toMatchObject({ rowIndex: 2, label: slots[0]!.label })

    // Confirmation screen replaces the form, with a way back (C10).
    expect(screen.queryByLabelText(/créneau disponible/i)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /réserver un autre créneau/i }))

    const select = await screen.findByLabelText<HTMLSelectElement>(/créneau disponible/i)
    expect(
      within(select)
        .queryAllByRole('option')
        .map((o) => o.textContent),
    ).not.toContain(slots[0]!.label)
  })

  it('re-fetches the list and resets the selection on STALE_SLOT', async () => {
    const user = userEvent.setup()
    let getCalls = 0
    server.use(
      http.get(API_URL, () => {
        getCalls += 1
        // After the failed booking the backend only offers the second slot.
        return HttpResponse.json(getCalls === 1 ? slots : [slots[1]])
      }),
      bookFails('STALE_SLOT', 'Ce créneau a changé, recharge la page.'),
    )
    render(<App />)

    await screen.findByLabelText(/créneau disponible/i)
    await fillForm(user, '2')

    expect(await screen.findByText(/ce créneau a changé/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(getCalls).toBe(2)
    })

    const select = await screen.findByLabelText<HTMLSelectElement>(/créneau disponible/i)
    expect(select.value).toBe('')
    expect(screen.queryByRole('option', { name: slots[0]!.label })).not.toBeInTheDocument()
  })

  it('exposes a single h1 and no axe violation', async () => {
    server.use(listSlots(), bookSucceeds())
    const { container } = render(<App />)

    await screen.findByLabelText(/créneau disponible/i)

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    const results = await axe(container)
    expect(results.violations).toEqual([])
  })
})
