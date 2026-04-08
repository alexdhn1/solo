export interface SourceFallbackState {
  isUnavailable: boolean
  userMessage: string
}

export const buildSourceFallback = (error?: unknown): SourceFallbackState => {
  if (!error) {
    return { isUnavailable: false, userMessage: '' }
  }

  return {
    isUnavailable: true,
    userMessage: 'Source Google Sheets indisponible temporairement. Reessayez dans quelques minutes.',
  }
}
