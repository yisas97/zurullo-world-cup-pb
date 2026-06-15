import { useEffect, useMemo, useState } from 'react'
import * as api from '../lib/api'
import type { LiveScore } from '../lib/api'
import type { Match, Player, Prediction, Session } from '../lib/types'
import { countdown, dayKey, dayLabel, isLocked, liveLabel, points, timeLabel } from '../lib/util'

type Live = { hs: number; as: number; status: string }

export default function Predictions({
  session, matches, players, preds, onSaved,
}: {
  session: Session; matches: Match[]; players: Player[]; preds: Prediction[]; onSaved: () => void
}) {
  const jornadas = useMemo(() => [...new Set(matches.map(m => m.jornada))].sort(), [matches])
  const [jornada, setJornada] = useState<number>(jornadas[0] ?? 1)
  const now = Date.now()

  // Marcadores en vivo (se refrescan cada 60s)
  const [live, setLive] = useState<LiveScore[]>([])
  useEffect(() => {
    let on = true
    const load = () => api.fetchLiveScores().then(l => { if (on) setLive(l) }).catch(() => {})
    load()
    const id = setInterval(load, 60000)
    return () => { on = false; clearInterval(id) }
  }, [])

  // Devuelve el marcador en vivo de un partido (orientado a local/visitante), si lo hay.
  // Si ya pasaron > 3h del inicio, el "en vivo" de la API casi seguro está atrasado -> se ignora.
  const MAX_LIVE_MS = 2.5 * 60 * 60 * 1000
  const liveFor = (m: Match): Live | undefined => {
    if (now - new Date(m.kickoff).getTime() > MAX_LIVE_MS) return undefined
    const r = live.find(l => l.home === m.home_team && l.away === m.away_team)
    if (r) return { hs: r.hs, as: r.as, status: r.status }
    const rr = live.find(l => l.home === m.away_team && l.away === m.home_team)
    if (rr) return { hs: rr.as, as: rr.hs, status: rr.status } // estaban invertidos
    return undefined
  }

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
                myPred={mine.get(m.id)} allPreds={byMatch.get(m.id) ?? []}
                live={liveFor(m)} onSaved={onSaved}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function MatchCard({
  m, session, players, now, myPred, allPreds, live, onSaved,
}: {
  m: Match; session: Session; players: Player[]; now: number
  myPred?: Prediction; allPreds: Prediction[]; live?: Live; onSaved: () => void
}) {
  const played = m.real_home != null && m.real_away != null
  const inPlay = !played && !!live
  const locked = isLocked(m.deadline, now)
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

  const started = now >= new Date(m.kickoff).getTime()
  const statusBadge = played ? (
    <span className="rounded-full bg-green-500/20 px-2.5 py-0.5 font-bold text-green-300">● Finalizado</span>
  ) : inPlay ? (
    <span className="rounded-full bg-red-500/25 px-2.5 py-0.5 font-bold text-red-300">🔴 EN VIVO · {liveLabel(live!.status)}</span>
  ) : locked && started ? (
    <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 font-semibold text-blue-200">Esperando resultado</span>
  ) : locked ? (
    <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-semibold text-white/50">Cerrado · por jugar</span>
  ) : (
    <span className="rounded-full bg-yellow-500/20 px-2.5 py-0.5 font-semibold text-yellow-300">Abierto · {countdown(m.deadline, now)}</span>
  )

  return (
    <div className={`rounded-xl border bg-white/[0.03] p-3 ${played ? 'border-green-500/20' : inPlay ? 'border-red-500/30' : !locked ? 'border-yellow-500/25' : 'border-white/10'}`}>
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="rounded bg-white/10 px-2 py-0.5 font-semibold text-white/70">
          Grupo {m.grupo} · {timeLabel(m.kickoff)}
        </span>
        {statusBadge}
      </div>

      {/* Equipos + marcador (resultado real si ya jugó, o tu pronóstico si no) */}
      <div className="flex items-center gap-2">
        <div className="flex-1 text-right font-semibold">
          {m.home_team} <span className="text-lg">{m.home_flag}</span>
        </div>

        {played ? (
          <div className="flex items-center gap-2 rounded-lg bg-green-500/15 px-3 py-1 text-2xl font-black text-green-300">
            <span>{m.real_home}</span><span className="text-white/30">-</span><span>{m.real_away}</span>
          </div>
        ) : inPlay ? (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/15 px-3 py-1 text-2xl font-black text-red-300">
            <span>{live!.hs}</span><span className="text-white/30">-</span><span>{live!.as}</span>
          </div>
        ) : locked ? (
          <div className="flex items-center gap-2 text-lg font-bold text-white/70">
            <span className="w-11 rounded-lg bg-black/40 py-1 text-center">{home || '–'}</span>
            <span className="text-white/30">-</span>
            <span className="w-11 rounded-lg bg-black/40 py-1 text-center">{away || '–'}</span>
          </div>
        ) : (
          <>
            <input
              type="number" min={0} value={home} onChange={e => setHome(e.target.value)}
              className="w-12 rounded-lg border border-white/15 bg-black/40 py-1.5 text-center text-lg font-bold outline-none focus:border-green-400"
            />
            <span className="text-white/40">-</span>
            <input
              type="number" min={0} value={away} onChange={e => setAway(e.target.value)}
              className="w-12 rounded-lg border border-white/15 bg-black/40 py-1.5 text-center text-lg font-bold outline-none focus:border-green-400"
            />
          </>
        )}

        <div className="flex-1 font-semibold">
          <span className="text-lg">{m.away_flag}</span> {m.away_team}
        </div>
      </div>

      {/* Etiqueta que aclara qué es el número del centro */}
      <div className={`mt-1 text-center text-[11px] uppercase tracking-wide ${inPlay ? 'text-red-300/80' : 'text-white/40'}`}>
        {played
          ? `Resultado final${m.went_penalties ? ' (penales)' : ''}`
          : inPlay ? 'Resultado del momento (en juego)'
          : locked ? 'Tu pronóstico (ya no editable)' : 'Tu pronóstico'}
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

      {/* Pronósticos de todos (visibles al cerrar el partido) */}
      <div className="mt-3 border-t border-white/10 pt-3">
        <div className="mb-1.5 text-[11px] uppercase tracking-wide text-white/40">
          Pronósticos {played && '· puntos'}
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {players.map(pl => {
            const pr = allPreds.find(p => p.player_id === pl.id)
            const isMe = pl.id === session.id
            const hidden = pr?.hidden ?? (!isMe && !locked)
            const pts = played ? points(pr, m) : null
            return (
              <div key={pl.id} className={`rounded-lg px-2 py-1 text-center text-xs ${pointColor(pts)} ${isMe ? 'ring-1 ring-white/25' : ''}`}>
                <div className="truncate font-semibold text-white/80">{pl.name}{isMe && ' (tú)'}</div>
                <div className="font-mono text-sm">
                  {hidden ? '🔒' : pr && pr.home != null ? `${pr.home}-${pr.away}` : '—'}
                  {pts != null && <span className="ml-1 font-bold">+{pts}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
