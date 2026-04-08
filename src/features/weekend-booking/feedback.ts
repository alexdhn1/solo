export const feedbackMessage = (error?: unknown) => {
  if (!error) return 'Reservation confirmee.'

  const message = String(error)
  if (message.includes('CONFLICT_UNAVAILABLE')) {
    return 'Ce weekend est deja occupe ou bloque.'
  }

  return 'Reservation impossible pour le moment.'
}
