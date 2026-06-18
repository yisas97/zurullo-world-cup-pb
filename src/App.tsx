import { useCallback, useEffect, useRef, useState } from 'react'
import { isConfigured } from './lib/supabase'
import * as api from './lib/api'
import type { Session, Match, Player, Prediction, BonusRow, Standing } from './lib/types'
import Login from './components/Login'
import Predictions from './components/Predictions'
import Standings from './components/Standings'
import Bonus from './components/Bonus'
import Admin from './components/Admin'
import Rules from './components/Rules'
import NotConfigured from './components/NotConfigured'
import trophy from './assets/trophy.png'
import { exportToExcel } from './lib/export'

type Tab = 'pronos' | 'tabla' | 'bonus' | 'admin' | 'reglas'

const SESSION_KEY = 'zwc_session'

export default function App() {
  const [session, setSession] = useState<Session | null>(() => {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  })
  const [tab, setTab] = useState<Tab>('pronos')

  const [matches, setMatches] = useState<Match[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [preds, setPreds] = useState<Prediction[]>([])
  const [bonus, setBonus] = useState<BonusRow[]>([])
  const [standings, setStandings] = useState<Standing[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadAll = useCallback(async (s: Session) => {
    setLoading(true); setError('')
    try {
      const [m, pl, pr, bo, st] = await Promise.all([
        api.getMatches(), api.getPlayers(), api.getPredictions(s),
        api.getBonus(s), api.getStandings(),
      ])
      setMatches(m); setPlayers(pl); setPreds(pr); setBonus(bo); setStandings(st)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (session) loadAll(session) }, [session, loadAll])

  // Al entrar/refrescar: pide a la BD que traiga los resultados reales (football-data).
  // Si actualizó alguno, recarga para mostrarlos. Se dispara una sola vez por carga.
  const synced = useRef(false)
  useEffect(() => {
    if (!session || synced.current) return
    synced.current = true
    api.syncResults()
      .then(r => { if ((r.actualizados ?? 0) > 0) loadAll(session) })
      .catch(() => {}) // si falla (función no desplegada, etc.) no rompe la app
  }, [session, loadAll])

  function onLogin(s: Session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    setSession(s)
  }
  function logout() {
    localStorage.removeItem(SESSION_KEY)
    setSession(null)
  }

  if (!isConfigured) return <NotConfigured />
  if (!session) return <Login onLogin={onLogin} />

  const refresh = () => loadAll(session)

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: 'pronos', label: 'Pronósticos', show: true },
    { key: 'tabla', label: 'Tabla', show: true },
    { key: 'bonus', label: 'Bonus', show: true },
    { key: 'admin', label: 'Admin', show: session.is_admin },
    { key: 'reglas', label: 'Reglas', show: true },
  ]

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src={trophy} alt="" className="h-10 w-auto sm:h-12" />
            <div className="leading-none">
              <div className="text-base font-black tracking-tight sm:text-xl">
                ZURULLO <span className="text-green-400">WORLD CUP</span>
              </div>
              <div className="mt-0.5 text-[10px] font-bold tracking-[0.35em] text-white/50">
                2026
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-white/70">{session.name}</span>
            <button onClick={logout} className="rounded-lg bg-white/10 px-3 py-1 hover:bg-white/20">
              Salir
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-2 pb-2">
          {tabs.filter(t => t.show).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                tab === t.key ? 'bg-green-500 text-black' : 'text-white/70 hover:bg-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-3 py-5">
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}
        {loading && <p className="py-10 text-center text-white/50">Cargando…</p>}

        {!loading && tab === 'pronos' && (
          <Predictions
            session={session} matches={matches} players={players}
            preds={preds} onSaved={refresh}
          />
        )}
        {!loading && tab === 'tabla' && (
          <>
            <div className="mb-3 flex justify-end">
              <button
                onClick={() => exportToExcel({ standings, players, matches, preds, bonus })}
                className="rounded-lg bg-white/10 px-4 py-1.5 text-sm font-semibold hover:bg-white/20"
              >
                Descargar Excel
              </button>
            </div>
            <Standings standings={standings} />
          </>
        )}
        {!loading && tab === 'bonus' && (
          <Bonus session={session} players={players} bonus={bonus} matches={matches} onSaved={refresh} />
        )}
        {!loading && tab === 'admin' && session.is_admin && (
          <Admin session={session} matches={matches} onSaved={refresh} />
        )}
        {!loading && tab === 'reglas' && <Rules />}
      </main>

      <footer className="py-6 text-center text-xs text-white/30">
        Zurullo World Cup · Mundial 2026 · TikTok: SEERGIALEES
      </footer>
    </div>
  )
}
