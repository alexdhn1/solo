import { planningApi } from '@/lib/api/client'
import { buildSourceFallback } from '@/lib/utils/sourceFallback'

import { buildPlanningViewModel } from './viewModel'

export const fetchPlanningOverview = async (fromDate: string, toDate: string) => {
  try {
    const payload = await planningApi.getPlanning(fromDate, toDate)
    return {
      items: buildPlanningViewModel(payload),
      fallback: buildSourceFallback(),
      lastSyncAt: payload.lastSyncAt,
    }
  } catch (error) {
    return {
      items: [],
      fallback: buildSourceFallback(error),
      lastSyncAt: '',
    }
  }
}
