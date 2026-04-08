import { describe, expect, it } from 'vitest'

import { buildSourceFallback } from '@/lib/utils/sourceFallback'

describe('buildSourceFallback', () => {
  it('returns non-error state without error', () => {
    const result = buildSourceFallback()
    expect(result.isUnavailable).toBe(false)
  })

  it('returns unavailable state with user message when error exists', () => {
    const result = buildSourceFallback(new Error('timeout'))
    expect(result.isUnavailable).toBe(true)
    expect(result.userMessage.length).toBeGreaterThan(0)
  })
})
