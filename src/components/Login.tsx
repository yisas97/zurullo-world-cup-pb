import { useEffect, useState } from 'react'
import * as api from '../lib/api'
import type { Player, Session } from '../lib/types'
import logo from '../assets/logo.png'

export default function Login({ onLogin }: { onLogin: (s: Session) => void }) {
  const [players, setPlayers] = useState<Player[]>([])
  const [picked, setPicked] = useState<Player | null>(null)
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getPlayers().then(setPlayers).catch(e => setError((e as Error).message))
  }, [])

  async function submit() {
    if (!picked || pin.length < 3) return
    setBusy(true); setError('')
    try {
      onLogin(await api.login(picked.id, pin))
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur">
        <div className="mb-6 rounded-xl bg-white p-3">
          <img src={logo} alt="Zurullo World Cup 2026" className="mx-auto w-full max-w-[260px]" />
        </div>

        {!picked ? (
          <>
            <p className="mb-3 text-center text-sm text-white/70">¿Quién eres?</p>
            <div className="grid grid-cols-2 gap-2">
              {players.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setPicked(p); setError('') }}
                  className="rounded-xl border border-white/10 bg-white/5 py-3 font-semibold hover:bg-green-500 hover:text-black"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="mb-1 text-center text-white/70">Hola, <b>{picked.name}</b></p>
            <p className="mb-4 text-center text-xs text-white/40">
              Escribe tu PIN. Si es tu primera vez, el que pongas quedará como tu PIN.
            </p>
            <input
              type="password" inputMode="text" autoFocus value={pin}
              onChange={e => setPin(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="PIN (mín. 3 caracteres)"
              className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-lg tracking-widest outline-none focus:border-green-400"
            />
            <button
              onClick={submit} disabled={busy || pin.length < 3}
              className="w-full rounded-xl bg-green-500 py-3 font-bold text-black disabled:opacity-40"
            >
              {busy ? 'Entrando…' : 'Entrar'}
            </button>
            <button onClick={() => { setPicked(null); setPin('') }} className="mt-3 w-full text-sm text-white/50 hover:text-white">
              ← cambiar jugador
            </button>
          </>
        )}

        {error && <p className="mt-4 text-center text-sm text-red-400">{error}</p>}
      </div>
    </div>
  )
}
