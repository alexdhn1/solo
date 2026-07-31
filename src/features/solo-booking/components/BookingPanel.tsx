import { VibesSection } from '@/features/solo-booking/components/VibesSection'
import { SoloForm } from '@/features/solo-booking/components/SoloForm'
import { FeedbackBanner } from '@/features/solo-booking/components/FeedbackBanner'
import type { Feedback } from '@/features/solo-booking/hooks/useSoloReservation'
import type { SoloReservationPayload, SoloWeekendSlot } from '@/lib/types'

interface Props {
  weekends: SoloWeekendSlot[]
  loading: boolean
  loadError: string | null
  onRetry: () => void
  selectedRow: number | null
  onSelectRow: (rowIndex: number | null) => void
  onSubmit: (payload: SoloReservationPayload) => Promise<void>
  submitting: boolean
  submitted: boolean
  onBookAnother: () => void
  feedback: Feedback | null
}

/** White card holding the pitch and the booking form. */
export function BookingPanel({
  weekends,
  loading,
  loadError,
  onRetry,
  selectedRow,
  onSelectRow,
  onSubmit,
  submitting,
  submitted,
  onBookAnother,
  feedback,
}: Props) {
  const banner = feedback ?? (loadError ? ({ type: 'error', text: loadError } as const) : null)

  return (
    <div className="rounded-[22px] bg-white/95 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-7">
      <VibesSection />

      <div className="my-6 h-px bg-linear-to-r from-transparent via-gray-300 to-transparent" />

      <h2 className="mb-4 text-lg font-bold text-gray-900">📅 Reserve ton week-end</h2>

      {loading && (
        <div className="py-8 text-center text-gray-500" role="status" aria-live="polite">
          <div
            className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-600"
            aria-hidden="true"
          />
          On verifie les dates disponibles…
        </div>
      )}

      {!loading && !submitted && weekends.length > 0 && (
        <SoloForm
          weekends={weekends}
          selectedRow={selectedRow}
          onSelectRow={onSelectRow}
          onSubmit={onSubmit}
          submitting={submitting}
        />
      )}

      {!loading && !submitted && weekends.length === 0 && !banner && (
        <p className="py-4 text-center text-sm italic text-gray-400">
          Aucun week-end disponible pour le moment.
        </p>
      )}

      <FeedbackBanner feedback={banner} />

      {!loading && loadError && (
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={onRetry}
            className="text-sm font-semibold text-emerald-700 underline underline-offset-4 hover:text-emerald-800"
          >
            Réessayer
          </button>
        </div>
      )}

      {submitted && (
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={onBookAnother}
            className="text-sm font-semibold text-emerald-700 underline underline-offset-4 hover:text-emerald-800"
          >
            Réserver un autre créneau
          </button>
        </div>
      )}
    </div>
  )
}
