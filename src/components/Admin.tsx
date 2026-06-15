import { useMemo, useState } from 'react'
import * as api from '../lib/api'
import type { Match, Session } from '../lib/types'
import { shortDate, timeLabel } from '../lib/util'

export default function Admin({
  session, matches, onSaved,
}: {
  session: Session; matches: Match[]; onSaved: () => void
}) {
  const jornadas = useMemo(() => [...new Set(matches.map(m => m.jornada))].sort(), [matches])
  const [jornada, setJornada] = useState<number>(jornadas[0] ?? 1)

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-200">
        Panel de administrador. Lo que cargues aquí actualiza la tabla de todos.
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold">Resultados reales</h3>
          <SyncButton session={session} matches={matches} onSaved={onSaved} />
        </div>
        <div className="mb-3 flex gap-2">
          {jornadas.map(j => (
            <button key={j} onClick={() => setJornada(j)}
              className={`rounded-lg px-4 py-1.5 text-sm font-bold ${jornada === j ? 'bg-green-500 text-black' : 'bg-white/10 text-white/70'}`}>
              J{j}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {matches.filter(m => m.jornada === jornada).map(m => (
            <ResultRow key={m.id} m={m} session={session} onSaved={onSaved} />
          ))}
        </div>
      </section>

      <BonusResults session={session} onSaved={onSaved} />

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/50">
        El bonus de la <b>peor selección</b> ahora se calcula <b>automáticamente</b> (1 punto por
        cada 3 goles en contra + 1 punto por cada gol a favor de la selección elegida).
      </section>
    </div>
  )
}

function SyncButton({ session, matches, onSaved }: { session: Session; matches: Match[]; onSaved: () => void }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function sync() {
    setBusy(true); setMsg('Consultando TheSportsDB…')
    try {
      const real = await api.fetchRealResults()
      let applied = 0
      for (const m of matches) {
        let hs: number | undefined, aw: number | undefined
        const r = real.find(x => x.home === m.home_team && x.away === m.away_team)
        if (r) { hs = r.hs; aw = r.as }
        else {
          const rr = real.find(x => x.home === m.away_team && x.away === m.home_team)
          if (rr) { hs = rr.as; aw = rr.hs } // estaban invertidos local/visitante
        }
        if (hs == null || aw == null) continue
        if (m.real_home === hs && m.real_away === aw) continue // ya estaba igual
        await api.setResult(session, m.id, hs, aw, m.went_penalties)
        applied++
      }
      setMsg(applied > 0 ? `✓ ${applied} resultado(s) actualizado(s)` : 'Sin novedades (todo al día)')
      if (applied > 0) onSaved()
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {msg && <span className="text-xs text-white/60">{msg}</span>}
      <button onClick={sync} disabled={busy}
        className="rounded-lg bg-blue-500 px-4 py-1.5 text-sm font-bold text-black disabled:opacity-40">
        {busy ? 'Sincronizando…' : 'Traer resultados reales'}
      </button>
    </div>
  )
}

function ResultRow({ m, session, onSaved }: { m: Match; session: Session; onSaved: () => void }) {
  const [home, setHome] = useState(m.real_home != null ? String(m.real_home) : '')
  const [away, setAway] = useState(m.real_away != null ? String(m.real_away) : '')
  const [pen, setPen] = useState(m.went_penalties)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function save() {
    if (home === '' || away === '') { setMsg('faltan goles'); return }
    setBusy(true); setMsg('')
    try {
      await api.setResult(session, m.id, Number(home), Number(away), pen)
      setMsg('✓'); onSaved()
    } catch (e) { setMsg((e as Error).message) } finally { setBusy(false) }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2 text-sm">
      <span className="hidden w-24 shrink-0 text-xs text-white/40 sm:block">
        {shortDate(m.kickoff)} · {timeLabel(m.kickoff)}
      </span>
      <span className="flex-1 text-right">{m.home_team} {m.home_flag}</span>
      <input type="number" min={0} value={home} onChange={e => setHome(e.target.value)}
        className="w-11 rounded bg-black/40 py-1 text-center" />
      <span>-</span>
      <input type="number" min={0} value={away} onChange={e => setAway(e.target.value)}
        className="w-11 rounded bg-black/40 py-1 text-center" />
      <span className="flex-1">{m.away_flag} {m.away_team}</span>
      <label className="flex items-center gap-1 text-xs text-white/60">
        <input type="checkbox" checked={pen} onChange={e => setPen(e.target.checked)} /> pen.
      </label>
      <button onClick={save} disabled={busy} className="rounded bg-green-500 px-3 py-1 font-bold text-black disabled:opacity-40">
        {busy ? '…' : 'Guardar'}
      </button>
      {msg && <span className="text-xs text-white/60">{msg}</span>}
    </div>
  )
}

function BonusResults({ session, onSaved }: { session: Session; onSaved: () => void }) {
  const [champion, setChampion] = useState('')
  const [runnerUp, setRunnerUp] = useState('')
  const [topScorer, setTopScorer] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function save() {
    setBusy(true); setMsg('')
    try {
      await api.setBonusResults(session, champion, runnerUp, topScorer)
      setMsg('✓ guardado'); onSaved()
    } catch (e) { setMsg((e as Error).message) } finally { setBusy(false) }
  }

  const cls = 'rounded-lg border border-white/15 bg-black/40 px-3 py-2 outline-none focus:border-green-400'
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="mb-1 font-bold">Resultados de los bonus</h3>
      <p className="mb-3 text-xs text-white/40">Escríbelos igual que los eligieron los jugadores (no importan mayúsculas).</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <input value={champion} onChange={e => setChampion(e.target.value)} placeholder="Campeón" className={cls} />
        <input value={runnerUp} onChange={e => setRunnerUp(e.target.value)} placeholder="Subcampeón" className={cls} />
        <input value={topScorer} onChange={e => setTopScorer(e.target.value)} placeholder="Goleador" className={cls} />
      </div>
      <div className="mt-3 flex items-center justify-end gap-3">
        {msg && <span className="text-xs text-white/60">{msg}</span>}
        <button onClick={save} disabled={busy} className="rounded-lg bg-green-500 px-5 py-2 font-bold text-black disabled:opacity-40">
          {busy ? '…' : 'Guardar'}
        </button>
      </div>
    </section>
  )
}
