const VIBES = [
  { emoji: '🍻', title: 'Tête-à-tête', desc: 'Un vrai moment entre potes, tranquille' },
  { emoji: '🏰', title: 'Châteaux de la Loire', desc: 'Chambord, Chenonceau… à deux c\'est mieux' },
  { emoji: '🍽️', title: 'Bonne bouffe', desc: 'Repas maison, on se fait plaisir' },
  { emoji: '🌲', title: 'Balade en forêt', desc: 'Pour déconnecter (ou papoter)' },
  { emoji: '🍾', title: 'Dégustation de vins', desc: 'On est en Touraine quand même' },
  { emoji: '💻', title: 'Télétravail possible', desc: 'Viens lundi-mardi bosser ici, bonne connexion' },
  { emoji: '🎲', title: 'Jeux de société', desc: 'Collection XXL, parfait à deux' },
  { emoji: '🔊', title: 'Système son Ibiza', desc: 'Pour les apéros, on a investi' },
]

const TAGS = [
  { label: '🐕 Chiens bienvenus', color: 'bg-orange-50 text-orange-700' },
  { label: '🐈 Chats aussi', color: 'bg-purple-50 text-purple-700' },
  { label: '👤 1 pote à la fois', color: 'bg-blue-50 text-blue-700' },
  { label: '🍳 Petit dèj inclus', color: 'bg-emerald-50 text-emerald-700' },
  { label: '🍴 Repas inclus', color: 'bg-orange-50 text-orange-700' },
  { label: '💻 Fibre + bureau dispo', color: 'bg-blue-50 text-blue-700' },
]

export function VibesSection() {
  return (
    <>
      <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
        🎯 Le concept Solo
      </h3>
      <p className="mb-4 text-sm leading-relaxed text-gray-600">
        Les weekends où Jenna bosse, la maison est libre pour recevoir un pote en tête-à-tête.
        Ambiance chill, pas le grand rassemblement — juste toi et moi.
        Tu peux venir <strong>vendredi → dimanche</strong> classique, ou prolonger{' '}
        <strong>lundi-mardi en télétravail</strong> si ça te chante.
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
        🛏️ Où tu dors
      </h3>
      <div className="mb-5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
        <strong>Chambre d'amis</strong> avec lit double confortable, toute à toi.
        Serviettes, draps, tout est prêt. Tu poses ton sac et c'est parti.
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
