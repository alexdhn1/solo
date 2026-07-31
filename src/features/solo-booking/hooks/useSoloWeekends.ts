import { useCallback, useEffect, useRef, useState } from 'react'
import { getSoloWeekends, isAbortError } from '@/lib/api/client'
import type { SoloWeekendSlot } from '@/lib/types'

export const LOAD_ERROR_MESSAGE =
  'Impossible de charger les créneaux. Réessaie dans quelques secondes 🙏'

export interface UseSoloWeekendsResult {
  weekends: SoloWeekendSlot[]
  loading: boolean
  error: string | null
  /** Re-fetch the full list from the backend (C2 / C7). */
  refetch: () => Promise<void>
  /** Optimistically drop a slot that is no longer bookable. */
  removeSlot: (rowIndex: number) => void
}

/**
 * Owns the list of bookable slots: fetch, abort on unmount, loading/error state
 * and a `refetch` used after any failed submission (C6).
 */
export function useSoloWeekends(): UseSoloWeekendsResult {
  const [weekends, setWeekends] = useState<SoloWeekendSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  // Kept free of synchronous setState so it can be called straight from an effect.
  const runLoad = useCallback(async () => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    try {
      const slots = await getSoloWeekends(controller.signal)
      if (controller.signal.aborted) return
      setWeekends(slots)
      setError(null)
    } catch (err) {
      if (controller.signal.aborted || isAbortError(err)) return
      setError(LOAD_ERROR_MESSAGE)
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [])

  const refetch = useCallback(async () => {
    setLoading(true)
    await runLoad()
  }, [runLoad])

  useEffect(() => {
    // Legitimate "subscribe to an external system" effect: every setState inside
    // `runLoad` happens after an await, i.e. never during the render pass. The
    // rule's static analysis cannot see through the async boundary.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void runLoad()
    return () => {
      controllerRef.current?.abort()
      controllerRef.current = null
    }
  }, [runLoad])

  const removeSlot = useCallback((rowIndex: number) => {
    setWeekends((prev) => prev.filter((slot) => slot.rowIndex !== rowIndex))
  }, [])

  return { weekends, loading, error, refetch, removeSlot }
}
