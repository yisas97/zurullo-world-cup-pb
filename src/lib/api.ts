import { supabase } from './supabase'
import type { Match, Player, Prediction, BonusRow, Standing, Session } from './types'
import { EN_NORM_TO_ES, norm } from './teams'

export async function login(id: number, pin: string): Promise<Session> {
  const { data, error } = await supabase.rpc('wc_login', { p_id: id, p_pin: pin })
  if (error) throw new Error(error.message)
  return { id: data.id, name: data.name, is_admin: data.is_admin, pin }
}

export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabase.from('players_public').select('*').order('id')
  if (error) throw new Error(error.message)
  return data as Player[]
}

export async function getMatches(): Promise<Match[]> {
  const { data, error } = await supabase.from('matches').select('*').order('kickoff').order('id')
  if (error) throw new Error(error.message)
  return data as Match[]
}

export async function getPredictions(s: Session): Promise<Prediction[]> {
  const { data, error } = await supabase.rpc('wc_get_predictions', { p_id: s.id, p_pin: s.pin })
  if (error) throw new Error(error.message)
  return data as Prediction[]
}

export async function savePrediction(s: Session, matchId: number, home: number, away: number) {
  const { error } = await supabase.rpc('wc_save_prediction', {
    p_id: s.id, p_pin: s.pin, p_match: matchId, p_home: home, p_away: away,
  })
  if (error) throw new Error(error.message)
}

export async function getBonus(s: Session): Promise<BonusRow[]> {
  const { data, error } = await supabase.rpc('wc_get_bonus', { p_id: s.id, p_pin: s.pin })
  if (error) throw new Error(error.message)
  return data as BonusRow[]
}

export async function saveBonus(
  s: Session, champion: string, runnerUp: string, topScorer: string, worstTeam: string,
) {
  const { error } = await supabase.rpc('wc_save_bonus', {
    p_id: s.id, p_pin: s.pin,
    p_champion: champion, p_runner_up: runnerUp, p_top_scorer: topScorer, p_worst_team: worstTeam,
  })
  if (error) throw new Error(error.message)
}

export async function getStandings(): Promise<Standing[]> {
  const { data, error } = await supabase.rpc('wc_standings')
  if (error) throw new Error(error.message)
  return data as Standing[]
}

export async function setResult(
  s: Session, matchId: number, home: number, away: number, penalties: boolean,
) {
  const { error } = await supabase.rpc('wc_set_result', {
    p_id: s.id, p_pin: s.pin, p_match: matchId, p_home: home, p_away: away, p_penalties: penalties,
  })
  if (error) throw new Error(error.message)
}

export async function setBonusResults(s: Session, champion: string, runnerUp: string, topScorer: string) {
  const { error } = await supabase.rpc('wc_set_bonus_results', {
    p_id: s.id, p_pin: s.pin, p_champion: champion, p_runner_up: runnerUp, p_top_scorer: topScorer,
  })
  if (error) throw new Error(error.message)
}

export async function setWorstPoints(s: Session, targetPlayer: number, pts: number) {
  const { error } = await supabase.rpc('wc_set_worst_points', {
    p_id: s.id, p_pin: s.pin, p_target: targetPlayer, p_points: pts,
  })
  if (error) throw new Error(error.message)
}

// Resultados reales del Mundial 2026 desde TheSportsDB (gratis, sin key, con CORS).
// Devuelve solo partidos finalizados, con los equipos ya traducidos a español.
export type RealResult = { home: string; away: string; hs: number; as: number }

export async function fetchRealResults(): Promise<RealResult[]> {
  const url = 'https://www.thesportsdb.com/api/v1/json/123/eventsseason.php?id=4429&s=2026'
  const res = await fetch(url)
  if (!res.ok) throw new Error('No se pudo consultar TheSportsDB (' + res.status + ')')
  const json = await res.json()
  const events: any[] = json.events || []
  const out: RealResult[] = []
  for (const e of events) {
    const hs = e.intHomeScore, aw = e.intAwayScore
    if (hs == null || aw == null || hs === '' || aw === '') continue // sin jugar
    const home = EN_NORM_TO_ES[norm(String(e.strHomeTeam ?? ''))]
    const away = EN_NORM_TO_ES[norm(String(e.strAwayTeam ?? ''))]
    if (!home || !away) continue // equipo no reconocido (se ignora)
    out.push({ home, away, hs: Number(hs), as: Number(aw) })
  }
  return out
}
