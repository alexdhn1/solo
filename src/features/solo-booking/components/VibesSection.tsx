const VIBES = [
  { emoji: '🥂', title: 'Apero', desc: 'On arrive, on ouvre quelque chose, et la soiree commence bien.' },
  { emoji: '🍝', title: 'Bon diner', desc: 'On mange bien, on prend le temps, et c est deja beaucoup.' },
  { emoji: '🚶', title: 'Balade', desc: 'Un tour dehors pour prendre l air et discuter tranquille.' },
  { emoji: '🛋️', title: 'Canape', desc: 'Un film, une serie, ou juste parler jusqu a tard.' },
  { emoji: '💻', title: 'Teletravail possible', desc: 'Si besoin, tu peux rester lundi ou mardi et bosser depuis la maison.' },
  { emoji: '🎲', title: 'Jeux', desc: 'Quelques parties, un peu de mauvaise foi, rien d anormal.' },
  { emoji: '🍷', title: 'Bonne ambiance', desc: 'Le but, c est surtout de passer un vrai bon moment.' },
  { emoji: '🌙', title: 'Temps calme', desc: 'Pas de programme force. On profite, c est tout.' },
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
        Les week-ends ou Jenna travaille, la maison est libre pour recevoir une personne a la fois.
        L'idee n'est pas de faire un gros rassemblement. C'est plutot un moment simple a deux, au calme,
        du <strong>vendredi au dimanche</strong>, avec possibilite de rester jusqu au{' '}
        <strong>lundi-mardi en teletravail</strong> si ca t arrange.
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
        <strong>Chambre d'amis</strong> avec lit double, draps propres et serviettes pretes.
        Tu poses ton sac et c'est regle.
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
