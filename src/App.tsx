import { useCallback, useEffect, useState } from 'react'
import { getSoloWeekends, submitSoloReservation } from '@/lib/api/client'
import { VibesSection } from '@/features/solo-booking/components/VibesSection'
import { SoloForm } from '@/features/solo-booking/components/SoloForm'
import type { SoloReservationPayload, SoloWeekendSlot } from '@/lib/types'

const HERO_IMAGE = {
  src: 'https://lh3.googleusercontent.com/d/11_ThPr1ZzGxfTZAqSpA5p2nmOf4Qm9ix',
  alt: 'Date solo a St-Georges-sur-Cher',
}

const BACKGROUND_IMAGE = {
  src: 'https://lh3.googleusercontent.com/d/1YFnKXzMpVPkGw1BuXcI6Xer9s3eL2p5n',
  alt: '',
}

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
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${BACKGROUND_IMAGE.src})` }}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-[1] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_32%),linear-gradient(180deg,rgba(8,17,14,0.28),rgba(8,17,14,0.74))]" />

      <div className="relative z-[2] mx-auto max-w-[640px] px-4 py-8 pb-16">
        <header className="mb-6 text-center text-white">
          <span className="mb-3 block text-5xl drop-shadow-lg">🥂🏡✨</span>
          <h1 className="mb-2 text-3xl font-black [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]">
            Week-end duo en cavale
          </h1>
          <p className="mx-auto max-w-md text-sm italic opacity-90 [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]">
            Quand le chat n'est pas la, les souris dansent.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-semibold backdrop-blur-md">
            📍 St-Georges-sur-Cher, maison calme et week-ends bien remplis
          </div>
        </header>

        <section className="mb-5 overflow-hidden rounded-[28px] border border-white/20 bg-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
          <img
            src={HERO_IMAGE.src}
            alt={HERO_IMAGE.alt}
            className="h-[290px] w-full object-cover sm:h-[360px]"
            style={{ objectPosition: 'center 22%' }}
            loading="eager"
          />
          <div className="grid gap-3 bg-[linear-gradient(180deg,rgba(255,248,240,0.96),rgba(255,252,249,0.94))] px-5 py-5 text-left sm:px-6">
            <div className="inline-flex w-fit items-center rounded-full bg-rose-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-rose-700">
              Absence de supervision confirmée
            </div>
            <h2 className="text-xl font-black text-stone-900">Un petit week-end simple, light en tete-à-tête </h2>
            <p className="text-sm leading-relaxed text-stone-700">
              L'idee est simple : Les week-ends où Jenna travaille, la maison est libre pour recevoir une ou 2 personne a la fois.
              L'idee n'est pas de faire un gros rassemblement. 
              C'est plutot un moment simple, au calme, retrouvaille romantique,
              avec possibilite de rester jusqu au lundi-mardi en teletravail si ca t arrange.
              Detente, profiter de la maison et de son jardin, 
              faire une balade dans les environs, ou ne rien faire du tout. 
              Programme allégé 
            </p>
          </div>
        </section>

        <div className="rounded-[22px] bg-white/95 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-7">
          <VibesSection />

          <div className="my-6 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

          <h2 className="mb-4 text-lg font-bold text-gray-900">📅 Reserve ton week-end</h2>

          {loading && (
            <div className="py-8 text-center text-gray-500">
              <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-600" />
              On verifie les dates disponibles…
            </div>
          )}

          {!loading && !submitted && weekends.length > 0 && (
            <SoloForm weekends={weekends} onSubmit={handleSubmit} />
          )}

          {!loading && !submitted && weekends.length === 0 && !feedback && (
            <p className="py-4 text-center text-sm italic text-gray-400">
              Aucun week-end disponible pour le moment.
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
