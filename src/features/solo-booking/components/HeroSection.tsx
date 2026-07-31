import { HERO_BADGE, HERO_IMAGE, HERO_TITLE, POEM } from '@/features/solo-booking/content'

/** Hero image + pitch. Purely presentational. */
export function HeroSection() {
  return (
    <section className="mb-5 overflow-hidden rounded-[28px] border border-white/20 bg-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
      <img
        src={HERO_IMAGE.src}
        alt={HERO_IMAGE.alt}
        width={HERO_IMAGE.width}
        height={HERO_IMAGE.height}
        className="h-[290px] w-full object-cover sm:h-[360px]"
        style={{ objectPosition: 'center 22%' }}
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />
      <div className="grid gap-3 bg-[linear-gradient(180deg,rgba(255,248,240,0.96),rgba(255,252,249,0.94))] px-5 py-5 text-left sm:px-6">
        <div className="inline-flex w-fit items-center rounded-full bg-rose-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-rose-700">
          {HERO_BADGE}
        </div>
        <h2 className="text-xl font-black text-stone-900">{HERO_TITLE}</h2>
        <p className="text-sm leading-relaxed text-stone-700 whitespace-pre-line">{POEM}</p>
      </div>
    </section>
  )
}
