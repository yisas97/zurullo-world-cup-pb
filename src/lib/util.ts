import type { Match, Prediction } from './types'

// Puntos de un pronostico contra el resultado real (3 exacto / 1 tendencia / 0 fallo)
export function points(pred: Prediction | undefined, m: Match): number | null {
  if (m.real_home == null || m.real_away == null) return null
  if (!pred || pred.home == null || pred.away == null) return 0
  if (pred.home === m.real_home && pred.away === m.real_away) return 3
  const sp = Math.sign(pred.home - pred.away)
  const sr = Math.sign(m.real_home - m.real_away)
  return sp === sr ? 1 : 0
}

const fmtDay = new Intl.DateTimeFormat('es-PE', {
  weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Lima',
})
const fmtTime = new Intl.DateTimeFormat('es-PE', {
  hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima',
})

export const dayLabel = (iso: string) => {
  const s = fmtDay.format(new Date(iso))
  return s.charAt(0).toUpperCase() + s.slice(1)
}
export const timeLabel = (iso: string) => fmtTime.format(new Date(iso))
export const dayKey = (iso: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date(iso))

export const isLocked = (deadlineIso: string, now: number) =>
  now >= new Date(deadlineIso).getTime()

// "faltan 3h 12m" / "faltan 2d"
export function countdown(deadlineIso: string, now: number): string {
  let s = Math.floor((new Date(deadlineIso).getTime() - now) / 1000)
  if (s <= 0) return 'cerrado'
  const d = Math.floor(s / 86400); s -= d * 86400
  const h = Math.floor(s / 3600); s -= h * 3600
  const m = Math.floor(s / 60)
  if (d > 0) return `faltan ${d}d ${h}h`
  if (h > 0) return `faltan ${h}h ${m}m`
  return `faltan ${m}m`
}
