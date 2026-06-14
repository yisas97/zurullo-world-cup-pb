import { useMemo, useState } from 'react'
import * as api from '../lib/api'
import type { BonusRow, Match, Player, Session } from '../lib/types'

const WORST_TEAMS = [
  'Irak', 'Sudáfrica', 'Arabia Saudí', 'Jordania', 'Bosnia y Herzegovina',
  'Cabo Verde', 'Ghana', 'Curazao', 'Haití', 'Nueva Zelanda',
]

export default function Bonus({
  session, players, bonus, matches, onSaved,
}: {
  session: Session; players: Player[]; bonus: BonusRow[]; matches: Match[]; onSaved: () => void
}) {
  // El bonus cierra antes del partido inaugural = deadline mas temprano
  const bonusLocked = useMemo(() => {
    if (matches.length === 0) return false
    const earliest = Math.min(...matches.map(m => new Date(m.deadline).getTime()))
    return Date.now() >= earliest
  }, [matches])

  const teams = useMemo(() => {
    const set = new Map<string, string>()
    matches.forEach(m => {
      set.set(m.home_team, m.home_flag)
      set.set(m.away_team, m.away_flag)
    })
    return [...set.entries()].map(([name, flag]) => ({ name, flag })).sort((a, b) => a.name.localeCompare(b.name))
  }, [matches])

  const mine = bonus.find(b => b.player_id === session.id)
  const [champion, setChampion] = useState(mine?.champion ?? '')
  const [runnerUp, setRunnerUp] = useState(mine?.runner_up ?? '')
  const [topScorer, setTopScorer] = useState(mine?.top_scorer ?? '')
  const [worstTeam, setWorstTeam] = useState(mine?.worst_team ?? '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function save() {
    setBusy(true); setMsg('')
    try {
      await api.saveBonus(session, champion, runnerUp, topScorer, worstTeam)
      setMsg('✓ guardado'); onSaved()
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const inputCls = 'w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 outline-none focus:border-green-400 disabled:opacity-50'

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h3 className="mb-1 font-bold">Tus apuestas bonus</h3>
        <p className="mb-4 text-xs text-white/50">
          {bonusLocked
            ? 'Cerrado: ya empezó el Mundial.'
            : 'Se cierran al empezar el partido inaugural. Campeón +10 · Subcampeón +5 · Goleador +5'}
        </p>

        {bonusLocked ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <ReadOnly label="Campeón (+10)" value={champion} />
            <ReadOnly label="Subcampeón (+5)" value={runnerUp} />
            <ReadOnly label="Máximo goleador (+5)" value={topScorer} />
            <ReadOnly label="Peor selección (reto)" value={worstTeam} />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-white/70">Campeón (+10)</span>
              <select value={champion} onChange={e => setChampion(e.target.value)} className={inputCls}>
                <option value="">— elige —</option>
                {teams.map(t => <option key={t.name} value={t.name}>{t.flag} {t.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-white/70">Subcampeón (+5)</span>
              <select value={runnerUp} onChange={e => setRunnerUp(e.target.value)} className={inputCls}>
                <option value="">— elige —</option>
                {teams.map(t => <option key={t.name} value={t.name}>{t.flag} {t.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-white/70">Máximo goleador (+5)</span>
              <input value={topScorer} onChange={e => setTopScorer(e.target.value)}
                placeholder="Nombre del jugador" className={inputCls} />
            </label>
            <label className="block">
              <span className="text-sm text-white/70">Peor selección (reto)</span>
              <select value={worstTeam} onChange={e => setWorstTeam(e.target.value)} className={inputCls}>
                <option value="">— elige —</option>
                {WORST_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>
        )}

        {!bonusLocked && (
          <div className="mt-4 flex items-center justify-end gap-3">
            {msg && <span className="text-xs text-white/60">{msg}</span>}
            <button onClick={save} disabled={busy} className="rounded-lg bg-green-500 px-5 py-2 font-bold text-black disabled:opacity-40">
              {busy ? '…' : 'Guardar bonus'}
            </button>
          </div>
        )}
      </div>

      {/* Resumen de todos */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/10 text-left text-xs uppercase text-white/60">
            <tr>
              <th className="px-3 py-2">Jugador</th>
              <th className="px-3 py-2">Campeón</th>
              <th className="px-3 py-2">Subcampeón</th>
              <th className="px-3 py-2">Goleador</th>
              <th className="px-3 py-2">Peor sel.</th>
            </tr>
          </thead>
          <tbody>
            {players.map(pl => {
              const b = bonus.find(x => x.player_id === pl.id)
              const cell = (v: string | null | undefined, hidden: boolean | undefined) =>
                hidden ? '🔒' : v || '—'
              return (
                <tr key={pl.id} className="border-t border-white/5">
                  <td className="px-3 py-2 font-semibold">{pl.name}</td>
                  <td className="px-3 py-2">{cell(b?.champion, b?.hidden)}</td>
                  <td className="px-3 py-2">{cell(b?.runner_up, b?.hidden)}</td>
                  <td className="px-3 py-2">{cell(b?.top_scorer, b?.hidden)}</td>
                  <td className="px-3 py-2">{cell(b?.worst_team, b?.hidden)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="block">
      <span className="text-sm text-white/70">{label}</span>
      <div className="mt-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-semibold">
        {value || '—'}
      </div>
    </div>
  )
}
