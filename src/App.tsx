import { useCallback, useEffect, useState } from 'react'
import { getSoloWeekends, submitSoloReservation } from '@/lib/api/client'
import type { SoloReservationPayload, SoloWeekendSlot } from '@/lib/types'
import { Carousel } from '@/features/solo-booking/components/Carousel'
import { VibesSection } from '@/features/solo-booking/components/VibesSection'
import { SoloForm } from '@/features/solo-booking/components/SoloForm'

const MAISON_IMAGES = [
  { src: 'https://lh3.googleusercontent.com/d/1ww1sXxwroIMyhaxitNUeyieSDe7Ro8-q', alt: 'Maison' },
  { src: 'https://lh3.googleusercontent.com/d/1B_GweVVptMLvmHzCFCAguePjCRlAJlbl', alt: 'Salon' },
  { src: 'https://lh3.googleusercontent.com/d/12SwBocYi_hgqaCNX2QGrQuZqsh1HUD0S', alt: "Chambre d'amis" },
  { src: 'https://lh3.googleusercontent.com/d/1zPqKahiTnp0hVf8V6mvbKP6AkgWP0Aed', alt: 'Poutres apparentes' },
  { src: 'https://lh3.googleusercontent.com/d/1aturEspvc_JoLtxV60rzQnGDDdlO_mG3', alt: 'Cuisine' },
  { src: 'https://lh3.googleusercontent.com/d/1uvSh_dqIu5VEnez06B1sT_88kGCPIpxZ', alt: 'Grosse ambiance' },
  { src: 'https://lh3.googleusercontent.com/d/1MPY5wOs-Dh-er5A8zTwM5ffie7LKk1IH', alt: 'Santé !' },
  { src: 'https://lh3.googleusercontent.com/d/1I9gRwzMF46EQ5BAjP8kIlhD04fuDv_N6', alt: 'Système son' },
]

const NATURE_IMAGES = [
  { src: 'https://lh3.googleusercontent.com/d/1TfzI8FVKhuwbKGgedlM1Uo3oeWciPQmE', alt: 'Baby tout mignon' },
  { src: 'https://lh3.googleusercontent.com/d/1pMy0icd1eN7ovmOINAdDeDtqj5fx-nRl', alt: 'Château' },
  { src: 'https://lh3.googleusercontent.com/d/1IZrx_SPZ6wZ2XkRnblO34FL4LwnOW-_N', alt: 'Se ressourcer' },
  { src: 'https://lh3.googleusercontent.com/d/1QXhV9yC0SaEGxtcoOjmgB7ouM_fyauyR', alt: 'Profiter' },
  { src: 'https://lh3.googleusercontent.com/d/1jKwFYgkimpB4fKZ4NHbUkYYG8ZiAna28', alt: 'Admirez' },
  { src: 'https://lh3.googleusercontent.com/d/1tjuji36b7qtW0znNwraZcidEbfcOHL8d', alt: 'Nouveau dôme' },
]

const BG_IMAGES = [...MAISON_IMAGES.slice(0, 8), ...NATURE_IMAGES.slice(0, 6), ...MAISON_IMAGES.slice(0, 2)]

function App() {
  const [weekends, setWeekends] = useState<SoloWeekendSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    getSoloWeekends()
      .then(setWeekends)
      .catch(() =>
        setFeedback({ type: 'error', text: 'Impossible de charger les créneaux. Réessaie dans quelques secondes 🙏' }),
      )
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = useCallback(async (payload: SoloReservationPayload) => {
    setFeedback(null)
    try {
      const result = await submitSoloReservation(payload)
      if (result.success) {
        setSubmitted(true)
        setFeedback({ type: 'success', text: result.message })
      } else {
        setFeedback({ type: 'error', text: result.message })
        // Remove the now-taken slot from the list
        setWeekends((prev) => prev.filter((w) => w.rowIndex !== payload.rowIndex))
      }
    } catch {
      setFeedback({ type: 'error', text: 'Une erreur est survenue. Réessaie dans quelques secondes 🙏' })
    }
  }, [])

  return (
    <>
      {/* Background mosaic */}
      <div className="fixed inset-0 z-0 grid grid-cols-2 auto-rows-[25vh] md:grid-cols-4">
        {BG_IMAGES.map((img, i) => (
          <img
            key={i}
            src={img.src}
            alt=""
            className="h-full w-full object-cover blur-[3px] brightness-[0.38] saturate-[0.8]"
            loading="lazy"
          />
        ))}
      </div>
      <div className="fixed inset-0 z-[1] bg-gradient-to-b from-black/35 via-black/15 to-black/45" />

      {/* Page content */}
      <div className="relative z-[2] mx-auto max-w-[640px] px-4 py-8 pb-16">
        {/* Hero */}
        <header className="mb-6 text-center text-white">
          <span className="mb-3 block text-5xl drop-shadow-lg">🍷🤝🏡</span>
          <h1 className="mb-2 text-3xl font-black [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]">
            Weekend Solo à St-Georges
          </h1>
          <p className="text-sm italic opacity-85 [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]">
            Un tête-à-tête entre potes, au calme en Touraine
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-semibold backdrop-blur-md">
            📍 St-Georges-sur-Cher, Loir-et-Cher
          </div>
        </header>

        {/* Carousels */}
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <div className="mb-1 text-center text-xs font-bold uppercase tracking-wider text-white/80">
              🏠 La maison
            </div>
            <Carousel images={MAISON_IMAGES} autoplayMs={4000} />
          </div>
          <div>
            <div className="mb-1 text-center text-xs font-bold uppercase tracking-wider text-white/80">
              🦁 Les alentours
            </div>
            <Carousel images={NATURE_IMAGES} autoplayMs={5400} />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-[22px] bg-white/95 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-7">
          <VibesSection />

          <div className="my-6 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

          <h2 className="mb-4 text-lg font-bold text-gray-900">📅 Réserve ton weekend solo</h2>

          {loading && (
            <div className="py-8 text-center text-gray-500">
              <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-600" />
              Vérification des créneaux disponibles…
            </div>
          )}

          {!loading && !submitted && weekends.length > 0 && (
            <SoloForm weekends={weekends} onSubmit={handleSubmit} />
          )}

          {!loading && !submitted && weekends.length === 0 && !feedback && (
            <p className="py-4 text-center text-sm italic text-gray-400">
              Aucun créneau solo disponible pour le moment… Reviens bientôt 😊
            </p>
          )}

          {feedback && (
            <div
              className={`mt-4 rounded-xl p-4 text-center text-sm font-medium leading-relaxed ${
                feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
              }`}
            >
              {feedback.text}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default App
