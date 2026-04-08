import { planningApi } from '@/lib/api/client'
import { hasWeekSessionConflict } from '@/lib/utils/conflictRules'
import type { AvailabilityBlock, WeekSession } from '@/lib/types'

import type { WeekSessionDraft } from './model'
import { toWeekSessionInput } from './model'

export interface UpsertWeekSessionDeps {
  existing: WeekSession[]
  blocks: AvailabilityBlock[]
  draft: WeekSessionDraft
}

export const upsertWeekSession = async ({ existing, blocks, draft }: UpsertWeekSessionDeps) => {
  const hasConflict = hasWeekSessionConflict(
    { date: draft.date, startTime: draft.startTime, endTime: draft.endTime },
    existing,
    blocks,
  )

  if (hasConflict) {
    throw new Error('CONFLICT_SCHEDULE')
  }

  return planningApi.upsertWeekSession(toWeekSessionInput(draft))
}
