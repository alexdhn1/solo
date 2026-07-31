import { useState, type FormEvent } from 'react'
import type { SoloWeekendSlot, SoloReservationPayload } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { DEFAULT_JOURS, JOURS_OPTIONS, type JoursChoisis } from '@/features/solo-booking/content'
import { firstErrorMessage, soloFormSchema } from '@/features/solo-booking/formSchema'

interface Props {
  weekends: SoloWeekendSlot[]
  /** Selection is owned by the parent so a refreshed list can reset it (C2). */
  selectedRow: number | null
  onSelectRow: (rowIndex: number | null) => void
  onSubmit: (payload: SoloReservationPayload) => Promise<void>
  submitting: boolean
}

export function SoloForm({ weekends, selectedRow, onSelectRow, onSubmit, submitting }: Props) {
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [joursChoisis, setJoursChoisis] = useState<JoursChoisis>(DEFAULT_JOURS)
  const [error, setError] = useState<string | null>(null)

  // Never trust a stale selection: the slot may have disappeared from the list.
  const selectedSlot = weekends.find((w) => w.rowIndex === selectedRow) ?? null

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const parsed = soloFormSchema.safeParse({
      rowIndex: selectedSlot?.rowIndex,
      label: selectedSlot?.label,
      nom,
      email,
      message,
      joursChoisis,
    })

    if (!parsed.success) {
      setError(firstErrorMessage(parsed.error))
      return
    }

    setError(null)
    await onSubmit({ action: 'soloReservation', ...parsed.data })
  }

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(e)
      }}
      className="grid gap-4"
      noValidate
    >
      {/* Weekend select */}
      <div className="grid gap-1.5">
        <label htmlFor="weekend" className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Créneau disponible 📅
        </label>
        <div className="relative">
          <select
            id="weekend"
            required
            value={selectedSlot ? String(selectedSlot.rowIndex) : ''}
            onChange={(e) => {
              onSelectRow(e.target.value ? Number(e.target.value) : null)
            }}
            className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 pr-10 text-sm text-gray-900 outline-none transition-colors focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10"
          >
            <option value="">— Choisir un créneau —</option>
            {weekends.map((w) => (
              <option key={w.rowIndex} value={w.rowIndex}>
                {w.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            ▾
          </span>
        </div>
      </div>

      {/* Jours choisis */}
      <div className="grid gap-1.5">
        <label htmlFor="jours" className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Tu restes quand ? 🗓️
        </label>
        <div className="relative">
          <select
            id="jours"
            value={joursChoisis}
            onChange={(e) => {
              setJoursChoisis(e.target.value as JoursChoisis)
            }}
            className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 pr-10 text-sm text-gray-900 outline-none transition-colors focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10"
          >
            {JOURS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            ▾
          </span>
        </div>
      </div>

      {/* Nom */}
      <div className="grid gap-1.5">
        <label htmlFor="nom" className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Ton prénom / nom 👤
        </label>
        <input
          id="nom"
          type="text"
          required
          placeholder="Ex : Thomas"
          value={nom}
          onChange={(e) => {
            setNom(e.target.value)
          }}
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none transition-colors focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10"
        />
      </div>

      {/* Email */}
      <div className="grid gap-1.5">
        <label htmlFor="email" className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Ton email 📧
        </label>
        <input
          id="email"
          type="email"
          required
          placeholder="thomas@exemple.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
          }}
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none transition-colors focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10"
        />
      </div>

      {/* Message */}
      <div className="grid gap-1.5">
        <label htmlFor="message" className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Un petit mot 💬
        </label>
        <textarea
          id="message"
          placeholder="J'arrive vendredi soir, j'apporte du fromage 🧀"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
          }}
          className="min-h-[80px] resize-y rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none transition-colors focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10"
        />
      </div>

      {/* The live region shares the button's grid cell so an empty error
          message costs no vertical space (C9 without touching the layout). */}
      <div>
        <div role="status" aria-live="polite">
          {error && <p className="mb-2 text-sm font-medium text-red-700">{error}</p>}
        </div>
        <Button
          type="submit"
          disabled={submitting || !selectedSlot}
          size="lg"
          className="w-full bg-linear-to-br from-emerald-700 to-emerald-500 py-4 text-base font-bold text-white hover:opacity-90"
        >
          {submitting ? '⏳ Réservation en cours…' : '🎉 Je réserve ce weekend solo !'}
        </Button>
      </div>
    </form>
  )
}
