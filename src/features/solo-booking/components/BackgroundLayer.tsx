import { BACKGROUND_IMAGE } from '@/features/solo-booking/content'

/** Fixed decorative backdrop: photo + gradient scrim. Purely presentational. */
export function BackgroundLayer() {
  return (
    <>
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${BACKGROUND_IMAGE.src})` }}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 z-[1] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_32%),linear-gradient(180deg,rgba(8,17,14,0.28),rgba(8,17,14,0.74))]"
        aria-hidden="true"
      />
    </>
  )
}
