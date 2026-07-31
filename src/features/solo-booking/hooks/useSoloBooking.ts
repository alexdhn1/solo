import { useCallback, useState } from 'react'
import {
  useSoloReservation,
  type UseSoloReservationResult,
} from '@/features/solo-booking/hooks/useSoloReservation'
import {
  useSoloWeekends,
  type UseSoloWeekendsResult,
} from '@/features/solo-booking/hooks/useSoloWeekends'

export interface UseSoloBookingResult
  extends Omit<UseSoloWeekendsResult, 'removeSlot'>,
    UseSoloReservationResult {
  selectedRow: number | null
  setSelectedRow: (rowIndex: number | null) => void
}

/**
 * Glue between the slot list and the submission (C6).
 * Contrat inter-lots : succès → le créneau réservé disparaît ; `success:false`
 * ou erreur réseau → re-fetch complet de la liste + reset de la sélection.
 */
export function useSoloBooking(): UseSoloBookingResult {
  const { weekends, loading, error, refetch, removeSlot } = useSoloWeekends()
  const [selectedRow, setSelectedRow] = useState<number | null>(null)

  const onSuccess = useCallback(
    (rowIndex: number) => {
      removeSlot(rowIndex)
      setSelectedRow(null)
    },
    [removeSlot],
  )

  const onFailure = useCallback(() => {
    setSelectedRow(null)
    void refetch()
  }, [refetch])

  const reservation = useSoloReservation({ onSuccess, onFailure })

  return { weekends, loading, error, refetch, selectedRow, setSelectedRow, ...reservation }
}
