import { useState } from 'react'
import type { SoloWeekendSlot, SoloReservationPayload } from '@/lib/types'
import { Button } from '@/components/ui/button'

const JOURS_OPTIONS = [
  'Vendredi → Dimanche',
  'Vendredi → Lundi (+ 1 jour TT)',
  'Vendredi → Mardi (+ 2 jours TT)',
  'Samedi → Dimanche',
  'Samedi → Lundi (+ TT lundi)',
  'Samedi → Mardi (+ TT lun-mar)',
]

interface Props {
  weekends: SoloWeekendSlot[]
  onSubmit: (payload: SoloReservationPayload) => Promise<void>
}

export function SoloForm({ weekends, onSubmit }: Props) {
  const [selectedRow, setSelectedRow] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [joursChoisis, setJoursChoisis] = useState(JOURS_OPTIONS[0])
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRow) return

    setSubmitting(true)
    try {
      await onSubmit({
        action: 'soloReservation',
        rowIndex: parseInt(selectedRow, 10),
        nom: nom.trim(),
        email: email.trim(),
        message: message.trim(),
        joursChoisis,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {/* Weekend select */}
      <div className="grid gap-1.5">
        <label htmlFor="weekend" className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Créneau disponible 📅
        </label>
        <div className="relative">
          <select
            id="weekend"
            required
            value={selectedRow}
            onChange={(e) => setSelectedRow(e.target.value)}
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
            onChange={(e) => setJoursChoisis(e.target.value)}
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
          onChange={(e) => setNom(e.target.value)}
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
          onChange={(e) => setEmail(e.target.value)}
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
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[80px] resize-y rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none transition-colors focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10"
        />
      </div>

      <Button
        type="submit"
        disabled={submitting || !selectedRow}
        size="lg"
        className="w-full bg-gradient-to-br from-emerald-700 to-emerald-500 py-4 text-base font-bold text-white hover:opacity-90"
      >
        {submitting ? '⏳ Réservation en cours…' : '🎉 Je réserve ce weekend solo !'}
      </Button>
    </form>
  )
}
