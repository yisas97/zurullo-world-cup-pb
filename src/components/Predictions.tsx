import { useMemo, useState } from 'react'
import * as api from '../lib/api'
import type { Match, Player, Prediction, Session } from '../lib/types'
import { countdown, dayKey, dayLabel, isLocked, points, timeLabel } from '../lib/util'

export default function Predictions({
  session, matches, players, preds, onSaved,
}: {
  session: Session; matches: Match[]; players: Player[]; preds: Prediction[]; onSaved: () => void
}) {
  const jornadas = useMemo(() => [...new Set(matches.map(m => m.jornada))].sort(), [matches])
  const [jornada, setJornada] = useState<number>(jornadas[0] ?? 1)
  const now = Date.now()

  const mine = useMemo(() => {
    const map = new Map<number, Prediction>()
    preds.filter(p => p.player_id === session.id).forEach(p => map.set(p.match_id, p))
    return map
  }, [preds, session.id])

  const byMatch = useMemo(() => {
    const map = new Map<number, Prediction[]>()
    preds.forEach(p => {
      const arr = map.get(p.match_id) ?? []
      arr.push(p); map.set(p.match_id, arr)
    })
    return map
  }, [preds])

  const matchesOfJornada = matches.filter(m => m.jornada === jornada)
  const days = [...new Set(matchesOfJornada.map(m => dayKey(m.kickoff)))]

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {jornadas.map(j => (
          <button
            key={j}
            onClick={() => setJornada(j)}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${
              jornada === j ? 'bg-green-500 text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Jornada {j}
          </button>
        ))}
      </div>

      {days.map(d => (
        <div key={d} className="mb-6">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-green-400">
            {dayLabel(matchesOfJornada.find(m => dayKey(m.kickoff) === d)!.kickoff)}
          </h3>
          <div className="space-y-3">
            {matchesOfJornada.filter(m => dayKey(m.kickoff) === d).map(m => (
              <MatchCard
                key={m.id} m={m} session={session} players={players} now={now}
                myPred={mine.get(m.id)} allPreds={byMatch.get(m.id) ?? []} onSaved={onSaved}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function MatchCard({
  m, session, players, now, myPred, allPreds, onSaved,
}: {
  m: Match; session: Session; players: Player[]; now: number
  myPred?: Prediction; allPreds: Prediction[]; onSaved: () => void
}) {
  const locked = isLocked(m.deadline, now)
  const played = m.real_home != null && m.real_away != null
  const [home, setHome] = useState(myPred?.home != null ? String(myPred.home) : '')
  const [away, setAway] = useState(myPred?.away != null ? String(myPred.away) : '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function save() {
    if (home === '' || away === '') { setMsg('Pon ambos marcadores'); return }
    setBusy(true); setMsg('')
    try {
      await api.savePrediction(session, m.id, Number(home), Number(away))
      setMsg('✓ guardado')
      onSaved()
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const pointColor = (p: number | null) =>
    p === 3 ? 'bg-green-500/30 text-green-300'
    : p === 1 ? 'bg-yellow-500/30 text-yellow-300'
    : p === 0 ? 'bg-red-500/30 text-red-300' : 'bg-white/5 text-white/50'

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="rounded bg-white/10 px-2 py-0.5 font-semibold text-white/70">
          Grupo {m.grupo} · {timeLabel(m.kickoff)}
        </span>
        {played ? (
          <span className="font-bold text-green-400">
            Final: {m.real_home}-{m.real_away}{m.went_penalties && ' (pen.)'}
          </span>
        ) : locked ? (
          <span className="font-semibold text-red-400">cerrado</span>
        ) : (
          <span className="font-semibold text-yellow-300">{countdown(m.deadline, now)}</span>
        )}
      </div>

      {/* Tu pronostico */}
      <div className="flex items-center gap-2">
        <div className="flex-1 text-right font-semibold">
          {m.home_team} <span className="text-lg">{m.home_flag}</span>
        </div>
        <input
          type="number" min={0} value={home} disabled={locked}
          onChange={e => setHome(e.target.value)}
          className="w-12 rounded-lg border border-white/15 bg-black/40 py-1.5 text-center text-lg font-bold outline-none focus:border-green-400 disabled:opacity-50"
        />
        <span className="text-white/40">-</span>
        <input
          type="number" min={0} value={away} disabled={locked}
          onChange={e => setAway(e.target.value)}
          className="w-12 rounded-lg border border-white/15 bg-black/40 py-1.5 text-center text-lg font-bold outline-none focus:border-green-400 disabled:opacity-50"
        />
        <div className="flex-1 font-semibold">
          <span className="text-lg">{m.away_flag}</span> {m.away_team}
        </div>
      </div>

      {!locked && (
        <div className="mt-2 flex items-center justify-end gap-3">
          {msg && <span className="text-xs text-white/60">{msg}</span>}
          <button
            onClick={save} disabled={busy}
            className="rounded-lg bg-green-500 px-4 py-1 text-sm font-bold text-black disabled:opacity-40"
          >
            {busy ? '…' : 'Guardar'}
          </button>
        </div>
      )}

      {/* Pronosticos de todos (visibles al cerrar el partido) */}
      <div className="mt-3 grid grid-cols-2 gap-1.5 border-t border-white/10 pt-3 sm:grid-cols-4">
        {players.map(pl => {
          const pr = allPreds.find(p => p.player_id === pl.id)
          const isMe = pl.id === session.id
          const hidden = pr?.hidden ?? (!isMe && !locked)
          const pts = played ? points(pr, m) : null
          return (
            <div key={pl.id} className={`rounded-lg px-2 py-1 text-center text-xs ${pointColor(pts)}`}>
              <div className="truncate font-semibold text-white/80">{pl.name}</div>
              <div className="font-mono text-sm">
                {hidden ? '🔒' : pr && pr.home != null ? `${pr.home}-${pr.away}` : '—'}
                {pts != null && <span className="ml-1 font-bold">+{pts}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
