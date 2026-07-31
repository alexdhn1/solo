import type { Feedback } from '@/features/solo-booking/hooks/useSoloReservation'

interface Props {
  feedback: Feedback | null
}

/**
 * Success / error banner. Announced to screen readers (C9): the live region is
 * always mounted so assistive tech picks up later content changes.
 */
export function FeedbackBanner({ feedback }: Props) {
  return (
    <div role="status" aria-live="polite">
      {feedback && (
        <div
          className={`mt-4 rounded-xl p-4 text-center text-sm font-medium leading-relaxed ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {feedback.text}
        </div>
      )}
    </div>
  )
}
