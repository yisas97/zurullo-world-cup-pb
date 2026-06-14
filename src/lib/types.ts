export type Session = {
  id: number
  pin: string
  name: string
  is_admin: boolean
}

export type Player = { id: number; name: string; is_admin: boolean }

export type Match = {
  id: number
  jornada: number
  fase: string
  grupo: string | null
  home_team: string
  home_flag: string
  away_team: string
  away_flag: string
  kickoff: string
  deadline: string
  real_home: number | null
  real_away: number | null
  went_penalties: boolean
}

export type Prediction = {
  player_id: number
  match_id: number
  home: number | null
  away: number | null
  hidden: boolean
}

export type BonusRow = {
  player_id: number
  champion: string | null
  runner_up: string | null
  top_scorer: string | null
  worst_team: string | null
  hidden: boolean
}

export type Standing = {
  player_id: number
  name: string
  total: number
  match_pts: number
  bonus_pts: number
  exact_count: number
  tendency_count: number
  champion_ok: boolean
  played: number
}
