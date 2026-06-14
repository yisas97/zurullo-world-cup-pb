import type { Standing } from '../lib/types'

const medal = ['🥇', '🥈', '🥉']

export default function Standings({ standings }: { standings: Standing[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <table className="w-full text-sm">
        <thead className="bg-white/10 text-left text-xs uppercase tracking-wide text-white/60">
          <tr>
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Jugador</th>
            <th className="px-3 py-2 text-center">Total</th>
            <th className="px-3 py-2 text-center">Partidos</th>
            <th className="px-3 py-2 text-center">Bonus</th>
            <th className="px-3 py-2 text-center" title="Marcadores exactos (desempate)">Exactos</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => (
            <tr key={s.player_id} className={`border-t border-white/5 ${i === 0 ? 'bg-green-500/10' : ''}`}>
              <td className="px-3 py-3 text-lg">{medal[i] ?? i + 1}</td>
              <td className="px-3 py-3 font-bold">
                {s.name}
                {s.champion_ok && <span className="ml-2 text-xs text-yellow-400" title="Acertó al campeón">👑</span>}
              </td>
              <td className="px-3 py-3 text-center text-xl font-black text-green-400">{s.total}</td>
              <td className="px-3 py-3 text-center text-white/70">{s.match_pts}</td>
              <td className="px-3 py-3 text-center text-white/70">{s.bonus_pts}</td>
              <td className="px-3 py-3 text-center text-white/70">{s.exact_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="bg-black/30 px-3 py-2 text-xs text-white/40">
        Desempate: más marcadores exactos → acertar al campeón.
      </p>
    </div>
  )
}
