import {
  GROUP_SITE_URL,
  PAGE_LOCATION,
  PAGE_SUBTITLE,
  PAGE_TITLE,
} from '@/features/solo-booking/content'

/** Floating link back to the group-weekend site. */
export function GroupSiteLink() {
  return (
    <a
      href={GROUP_SITE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed top-4 right-4 z-[10] inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md shadow-lg transition hover:bg-white/25"
    >
      👫 Week-end groupe
    </a>
  )
}

/** Title block of the page. Holds the single `<h1>` of the document (C9). */
export function PageHeader() {
  return (
    <header className="mb-6 text-center text-white">
      <span className="mb-3 block text-5xl drop-shadow-lg" aria-hidden="true">
        🥂🏡✨
      </span>
      <h1 className="mb-2 text-3xl font-black [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]">
        {PAGE_TITLE}
      </h1>
      <p className="mb-2 text-3xl font-black [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]">
        {PAGE_SUBTITLE}
      </p>
      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-semibold backdrop-blur-md">
        {PAGE_LOCATION}
      </div>
    </header>
  )
}
