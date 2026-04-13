const VIBES = [
  { emoji: '🥂', title: 'Apero de prelude', desc: 'On commence par un verre rapide, puis mysterieuxement le soleil se couche.' },
  { emoji: '🍝', title: 'Diner presque tendre', desc: 'Quelqu un cuisine, l autre goute, personne n avoue que c est tres touchant.' },
  { emoji: '🚶', title: 'Promenade scenario B', desc: 'On sort marcher comme si on etait des gens equilibres, c est tres convaincant.' },
  { emoji: '🛋️', title: 'Canape cinematographique', desc: 'Film discutable, commentaires excellents, couverture eventuellement partagee.' },
  { emoji: '💻', title: 'Teletravail cote a cote', desc: 'Lundi-mardi si besoin, avec fibre solide et concentration tres negociable.' },
  { emoji: '🎲', title: 'Jeux et mauvaise foi', desc: 'Les regles deviennent soudain tres floues des que quelqu un perd avec panache.' },
  { emoji: '🍷', title: 'Grandes declarations inutiles', desc: 'On se promet des projets absurdes qu on n executera probablement jamais.' },
  { emoji: '🌙', title: 'Silence premium', desc: 'Le luxe rare de n avoir rien a prouver et pourtant beaucoup a raconter.' },
]

const TAGS = [
  { label: '🛏️ chambre prete', color: 'bg-rose-50 text-rose-700' },
  { label: '🍳 petit dej reparateur', color: 'bg-amber-50 text-amber-700' },
  { label: '💻 fibre pour prolonger', color: 'bg-sky-50 text-sky-700' },
  { label: '🐾 animaux diplomates acceptes', color: 'bg-emerald-50 text-emerald-700' },
  { label: '🥘 repas maison selon elan', color: 'bg-orange-50 text-orange-700' },
  { label: '✨ duo seulement', color: 'bg-violet-50 text-violet-700' },
]

export function VibesSection() {
  return (
    <>
      <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
        🎯 Le concept
      </h3>
      <p className="mb-4 text-sm leading-relaxed text-gray-600">
        Quand Jenna travaille, la maison passe en mode parenthese confidentielle. Pas de grand groupe, pas de
        logistique de bande, pas de debat infini sur qui amene quoi. Juste deux personnes, un decor de campagne,
        une ambiance un peu trop soignee pour etre tout a fait innocente et la possibilite de tirer le plaisir du{' '}
        <strong>vendredi au dimanche</strong> ou de glisser jusqu au <strong>lundi-mardi en teletravail</strong>.
      </p>

      <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {VIBES.map((v) => (
          <div
            key={v.title}
            className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2.5"
          >
            <span className="text-xl">{v.emoji}</span>
            <div>
              <div className="text-sm font-semibold text-gray-800">{v.title}</div>
              <div className="text-xs text-gray-500">{v.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
        🛏️ Base arriere
      </h3>
      <div className="mb-5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
        <strong>Chambre d'amis</strong> avec lit double, draps propres, serviettes pretes et zero theatre logistique.
        Tu poses ton sac, tu souffles deux secondes, et le faux week-end romantique peut commencer tres serieusement.
      </div>

      <div className="flex flex-wrap gap-2">
        {TAGS.map((t) => (
          <span key={t.label} className={`rounded-full px-3 py-1 text-xs font-semibold ${t.color}`}>
            {t.label}
          </span>
        ))}
      </div>
    </>
  )
}
