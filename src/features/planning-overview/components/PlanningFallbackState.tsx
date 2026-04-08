interface Props {
  isUnavailable: boolean
  userMessage: string
}

export function PlanningFallbackState({ isUnavailable, userMessage }: Props) {
  if (!isUnavailable) return null

  return (
    <div className="rounded-xl border border-red-400/50 bg-red-50 px-3 py-2 text-sm text-red-800">
      {userMessage}
    </div>
  )
}
