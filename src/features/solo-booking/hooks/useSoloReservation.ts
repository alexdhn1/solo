import { useCallback, useEffect, useRef, useState } from 'react'
import { isAbortError, submitSoloReservation } from '@/lib/api/client'
import type { SoloReservationPayload } from '@/lib/types'

export const NETWORK_ERROR_MESSAGE =
  'Une erreur est survenue. Réessaie dans quelques secondes 🙏'

export interface Feedback {
  type: 'success' | 'error'
  text: string
}

export interface UseSoloReservationOptions {
  /** Called with the booked rowIndex so the parent can drop the slot (C2). */
  onSuccess?: (rowIndex: number) => void
  /** Called on any `success: false` or network error: the parent re-fetches (C2). */
  onFailure?: () => void
}

export interface UseSoloReservationResult {
  submit: (payload: SoloReservationPayload) => Promise<void>
  submitting: boolean
  submitted: boolean
  feedback: Feedback | null
  setFeedback: (feedback: Feedback | null) => void
  /** "Réserver un autre créneau" — clears the confirmation screen (C10). */
  reset: () => void
}

/**
 * Owns the submission lifecycle: POST, abort on unmount, feedback banner and
 * the post-submit resynchronisation contract (C2 / C6 / C7).
 */
export function useSoloReservation(
  options: UseSoloReservationOptions = {},
): UseSoloReservationResult {
  const { onSuccess, onFailure } = options
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(
    () => () => {
      controllerRef.current?.abort()
      controllerRef.current = null
    },
    [],
  )

  const submit = useCallback(
    async (payload: SoloReservationPayload) => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      setFeedback(null)
      setSubmitting(true)
      try {
        const result = await submitSoloReservation(payload, controller.signal)
        if (controller.signal.aborted) return
        if (result.success) {
          setSubmitted(true)
          setFeedback({ type: 'success', text: result.message })
          onSuccess?.(payload.rowIndex)
        } else {
          setFeedback({ type: 'error', text: result.message })
          onFailure?.()
        }
      } catch (err) {
        if (controller.signal.aborted || isAbortError(err)) return
        setFeedback({ type: 'error', text: NETWORK_ERROR_MESSAGE })
        onFailure?.()
      } finally {
        if (!controller.signal.aborted) setSubmitting(false)
      }
    },
    [onSuccess, onFailure],
  )

  const reset = useCallback(() => {
    setSubmitted(false)
    setFeedback(null)
  }, [])

  return { submit, submitting, submitted, feedback, setFeedback, reset }
}
