import {
  ADDRESS_LABEL,
  ADDRESS_LINES,
  MAP_LINKS,
  PRACTICAL_TITLE,
  TRAVEL_NOTE,
} from '@/features/solo-booking/content'

/**
 * « Infos pratiques » : adresse postale + liens cartographiques.
 * Les liens sont des recherches par adresse (aucune coordonnée GPS).
 */
export function PracticalInfoSection() {
  return (
    <section
      aria-labelledby="infos-pratiques-title"
      className="mt-5 rounded-[22px] bg-white/95 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-7"
    >
      <h2 id="infos-pratiques-title" className="mb-4 text-lg font-bold text-gray-900">
        {PRACTICAL_TITLE}
      </h2>

      <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
        <h3 className="mb-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
          {ADDRESS_LABEL}
        </h3>
        <address className="text-sm not-italic leading-relaxed text-gray-700">
          {ADDRESS_LINES.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </address>
      </div>

      <ul className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {MAP_LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
            >
              <span className="text-lg" aria-hidden="true">
                {link.emoji}
              </span>
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      <p className="text-xs leading-relaxed text-gray-500">{TRAVEL_NOTE}</p>
    </section>
  )
}
