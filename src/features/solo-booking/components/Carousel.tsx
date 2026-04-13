import { useState, useEffect, useCallback } from 'react'
import type { SoloWeekendSlot } from '@/lib/types'

interface Props {
  images: { src: string; alt: string }[]
  autoplayMs?: number
}

export function Carousel({ images, autoplayMs = 4000 }: Props) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), autoplayMs)
    return () => clearInterval(id)
  }, [images.length, autoplayMs])

  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + images.length) % images.length),
    [images.length],
  )

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl md:aspect-video">
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.map((img, i) => (
          <img
            key={i}
            src={img.src}
            alt={img.alt}
            className="h-full w-full flex-shrink-0 object-cover"
            loading="lazy"
            draggable={false}
          />
        ))}
      </div>

      {/* Navigation */}
      <button
        onClick={() => go(-1)}
        className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-lg text-white transition-colors hover:bg-black/60"
      >
        ‹
      </button>
      <button
        onClick={() => go(1)}
        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-lg text-white transition-colors hover:bg-black/60"
      >
        ›
      </button>

      {/* Caption */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 px-3 pb-2 pt-6 text-center text-xs font-semibold text-white">
        {images[index]?.alt}
      </div>

      {/* Dots */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 pb-8">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-1.5 w-1.5 rounded-full transition-all ${i === index ? 'scale-125 bg-white' : 'bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  )
}

// Re-export slot type for convenience
export type { SoloWeekendSlot }
