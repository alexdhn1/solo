import { planningApi } from '@/lib/api/client'
import { hasWeekendConflict } from '@/lib/utils/conflictRules'
import type { AvailabilityBlock, WeekendReservation } from '@/lib/types'

import type { WeekendReservationDraft } from './model'
import { toReservationInput } from './model'

export interface ReserveWeekendDeps {
  existing: WeekendReservation[]
  blocks: AvailabilityBlock[]
  draft: WeekendReservationDraft
}

export const reserveWeekend = async ({ existing, blocks, draft }: ReserveWeekendDeps) => {
  const [startDate = '', endDate = ''] = draft.weekendLabel.split('|')
  const hasConflict = hasWeekendConflict({ startDate, endDate }, existing, blocks)
  if (hasConflict) {
    throw new Error('CONFLICT_UNAVAILABLE')
  }

  return planningApi.reserveWeekend(toReservationInput(draft))
}
