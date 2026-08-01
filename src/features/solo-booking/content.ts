/**
 * Static, editorial content of the solo-booking page (C15).
 * Everything a non-developer might want to tweak lives here.
 */

export interface PageImage {
  readonly src: string
  readonly alt: string
  readonly width: number
  readonly height: number
}

export const HERO_IMAGE: PageImage = {
  src: 'https://lh3.googleusercontent.com/d/11_ThPr1ZzGxfTZAqSpA5p2nmOf4Qm9ix',
  alt: 'Date solo a St-Georges-sur-Cher',
  width: 1280,
  height: 720,
}

export const BACKGROUND_IMAGE: PageImage = {
  src: 'https://lh3.googleusercontent.com/d/1YFnKXzMpVPkGw1BuXcI6Xer9s3eL2p5n',
  alt: '',
  width: 1920,
  height: 1280,
}

/** Origin of the remotely hosted images — used for the <link rel="preconnect">. */
export const IMAGE_ORIGIN = 'https://lh3.googleusercontent.com'

export const GROUP_SITE_URL = 'https://alexdhn1.github.io/weekends-chez-alex/'

export const PAGE_TITLE = 'Week-end duo en cavale'
export const PAGE_SUBTITLE = "Quand le chat n'est pas la, les souris dansent."
export const PAGE_LOCATION = '📍 St-Georges-sur-Cher, maison calme et week-ends bien remplis'

export const HERO_BADGE = 'Absence de supervision confirmée'
export const HERO_TITLE = 'Un petit week-end en tete-à-tête '

export const POEM = `Simple est l’idée : maison dispo quand Jenna bosse à côté,
            À une ou deux personnes, tranquille, sans foule agitée.

            Pas de grosse soirée, mais un moment posé,
            Romantique ou chill, juste pour se retrouver.

            Rester tu peux, lundi ou mardi inclus,
            Télétravailler au calme, sans stress ni chahut.

            Maison et jardin, profiter tu feras,
            Balade ou rien du tout, comme tu voudras.

            Programme léger, esprit libéré,
            Venir, se poser… et juste kiffer.`

export interface Vibe {
  readonly emoji: string
  readonly title: string
  readonly desc: string
}

export const VIBES: readonly Vibe[] = [
  { emoji: '🥂', title: 'Apéro', desc: 'Locaux les vins tu goûteras, rhum arrangé tu savoureras.' },
  { emoji: '🍝', title: 'Bon dîner', desc: 'La popote nous ferons, ou des pizzas nous prendrons.' },
  { emoji: '🚶', title: 'Balade', desc: 'Tes chaussures tu prendras, marcher longtemps tu pourras.' },
  { emoji: '🛋️', title: 'Canapé', desc: 'Un film tu regarderas, ou tard tu discuteras.' },
  {
    emoji: '💻',
    title: 'Télétravail possible',
    desc: 'Lundi rester tu pourras, depuis la maison tu bosseras.',
  },
  { emoji: '🎲', title: 'Jeux', desc: 'Mario Kart tu joueras, Monopoly tu gagneras.' },
  { emoji: '🍷', title: 'Bonne ambiance', desc: 'Les bars tu exploreras, bonne vibe tu trouveras.' },
  {
    emoji: '🌙',
    title: 'Temps calme',
    desc: 'Moment paisible tu vivras, Epilepchibre tu comprendras.',
  },
]

export interface Tag {
  readonly label: string
  readonly color: string
}

export const TAGS: readonly Tag[] = [
  { label: '🛏️ chambre prete', color: 'bg-rose-50 text-rose-700' },
  { label: '🍳 petit dej reparateur', color: 'bg-amber-50 text-amber-700' },
  { label: '💻 fibre pour prolonger', color: 'bg-sky-50 text-sky-700' },
  { label: '🐾 animaux mignons acceptes', color: 'bg-emerald-50 text-emerald-700' },
  { label: '✨ duo seulement', color: 'bg-violet-50 text-violet-700' },
]

/* ---------------------------------------------------------------- *
 * Infos pratiques (V2-C)
 * Adresse et liens cartographiques : recherche par requête, aucune
 * coordonnée GPS ni durée de trajet inventée.
 * ---------------------------------------------------------------- */

export const PRACTICAL_TITLE = '🧭 Infos pratiques'

export const ADDRESS_LABEL = 'Adresse'
export const ADDRESS_LINES: readonly string[] = [
  '9 rue des Vendanges',
  '41400 Saint-Georges-sur-Cher',
]
export const ADDRESS_FULL = '9 rue des Vendanges, 41400 Saint-Georges-sur-Cher'

export const TRAVEL_NOTE =
  'À ~2h de Paris en voiture, gare de Saint-Georges-sur-Cher desservie depuis Tours.'

/** Guide des sorties (page statique maintenue par Alex, mise à jour chaque semaine). */
export const SORTIES_BASE_URL = 'https://alexdhn1.github.io/sorties-cher/'
export const SORTIES_LINK_LABEL =
  'Le guide des sorties d’Alex : châteaux, marchés, brocantes et idées autour de la maison'
export const SORTIES_SLOT_LABEL = 'Voir quoi faire pendant ce séjour'

export interface MapLink {
  readonly emoji: string
  /** Explicit, self-describing label (no "cliquez ici"). */
  readonly label: string
  readonly href: string
}

export const MAP_LINKS: readonly MapLink[] = [
  {
    emoji: '🗺️',
    label: 'Ouvrir l’adresse dans Google Maps',
    href: 'https://www.google.com/maps/search/?api=1&query=9+rue+des+Vendanges+41400+Saint-Georges-sur-Cher',
  },
  {
    emoji: '🍎',
    label: 'Ouvrir l’adresse dans Apple Plans',
    href: 'https://maps.apple.com/?q=9+rue+des+Vendanges+41400+Saint-Georges-sur-Cher',
  },
  {
    emoji: '🚗',
    label: 'Ouvrir l’adresse dans Waze',
    href: 'https://waze.com/ul?q=9%20rue%20des%20Vendanges%2041400%20Saint-Georges-sur-Cher',
  },
]

/** Allowed values of the "jours choisis" select — mirrored server-side (B3). */
export const JOURS_OPTIONS = [
  'Vendredi → Dimanche',
  'Vendredi → Lundi (+ 1 jour TT)',
  'Vendredi → Mardi (+ 2 jours TT)',
  'Samedi → Dimanche',
  'Samedi → Lundi (+ TT lundi)',
  'Samedi → Mardi (+ TT lun-mar)',
] as const

export type JoursChoisis = (typeof JOURS_OPTIONS)[number]

export const DEFAULT_JOURS: JoursChoisis = JOURS_OPTIONS[0]
