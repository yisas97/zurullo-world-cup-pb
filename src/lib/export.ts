import type { BonusRow, Match, Player, Prediction, Standing } from './types'
import { points, shortDate, timeLabel } from './util'

type Data = {
  standings: Standing[]
  players: Player[]
  matches: Match[]
  preds: Prediction[]
  bonus: BonusRow[]
}

const GREEN = 'FF2E7D32', YELLOW = 'FFF9A825', RED = 'FFC62828'
const HEADER_BG = 'FF14532D', HEADER_FG = 'FFFFFFFF'

export async function exportToExcel({ standings, players, matches, preds, bonus }: Data) {
  const mod: any = await import('exceljs')
  const ExcelJS = mod.default ?? mod
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Zurullo World Cup'

  const styleHeader = (row: any) => {
    row.font = { bold: true, color: { argb: HEADER_FG } }
    row.eachCell((c: any) => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } }
      c.alignment = { vertical: 'middle', horizontal: 'center' }
      c.border = { bottom: { style: 'thin', color: { argb: 'FF999999' } } }
    })
  }
  const fillCell = (cell: any, argb: string) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } }
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true }
    cell.alignment = { horizontal: 'center' }
  }

  // ---------- Hoja 1: Tabla ----------
  const t = wb.addWorksheet('Tabla', { views: [{ state: 'frozen', ySplit: 1 }] })
  t.columns = [
    { header: 'Pos', width: 6 }, { header: 'Jugador', width: 16 },
    { header: 'Total', width: 8 }, { header: 'Partidos', width: 10 },
    { header: 'Bonus', width: 8 }, { header: 'Exactos', width: 9 },
    { header: 'Tendencias', width: 12 },
  ]
  standings.forEach((s, i) => t.addRow([i + 1, s.name, s.total, s.match_pts, s.bonus_pts, s.exact_count, s.tendency_count]))
  styleHeader(t.getRow(1))
  t.getColumn(3).eachCell((c: any, r: number) => { if (r > 1) c.font = { bold: true } })

  // ---------- Hoja 2: Pronósticos ----------
  const predMap = new Map<string, Prediction>()
  preds.forEach(p => predMap.set(`${p.player_id}-${p.match_id}`, p))

  const ws = wb.addWorksheet('Pronósticos', { views: [{ state: 'frozen', ySplit: 1 }] })
  ws.columns = [
    { header: 'J', width: 4 }, { header: 'Fecha', width: 8 }, { header: 'Hora', width: 7 },
    { header: 'Grupo', width: 7 }, { header: 'Partido', width: 34 }, { header: 'Resultado', width: 11 },
    ...players.map(p => ({ header: p.name, width: 12 })),
  ]
  matches.forEach(m => {
    const real = m.real_home != null ? `${m.real_home} - ${m.real_away}` : ''
    const rowVals: (string | number)[] = [
      `J${m.jornada}`, shortDate(m.kickoff), timeLabel(m.kickoff), m.grupo ?? '',
      `${m.home_team} vs ${m.away_team}`, real,
    ]
    players.forEach(pl => {
      const pr = predMap.get(`${pl.id}-${m.id}`)
      rowVals.push(!pr ? '' : pr.hidden ? '(oculto)' : pr.home == null ? '' : `${pr.home}-${pr.away}`)
    })
    const row = ws.addRow(rowVals)
    // colorea la celda de cada jugador según puntos (como tu Excel)
    players.forEach((pl, idx) => {
      const pr = predMap.get(`${pl.id}-${m.id}`)
      if (!pr || pr.hidden || pr.home == null) return
      const pts = points(pr, m)
      if (pts == null) return
      fillCell(row.getCell(7 + idx), pts === 3 ? GREEN : pts === 1 ? YELLOW : RED)
    })
  })
  styleHeader(ws.getRow(1))

  // ---------- Hoja 3: Bonus ----------
  const bonusMap = new Map<number, BonusRow>()
  bonus.forEach(b => bonusMap.set(b.player_id, b))
  const cell = (v: string | null | undefined, hidden: boolean | undefined) =>
    hidden ? '(oculto)' : v || ''
  const b = wb.addWorksheet('Bonus', { views: [{ state: 'frozen', ySplit: 1 }] })
  b.columns = [
    { header: 'Jugador', width: 16 }, { header: 'Campeón', width: 16 },
    { header: 'Subcampeón', width: 16 }, { header: 'Goleador', width: 16 },
    { header: 'Peor selección', width: 18 },
  ]
  players.forEach(pl => {
    const bp = bonusMap.get(pl.id)
    b.addRow([pl.name, cell(bp?.champion, bp?.hidden), cell(bp?.runner_up, bp?.hidden),
      cell(bp?.top_scorer, bp?.hidden), cell(bp?.worst_team, bp?.hidden)])
  })
  styleHeader(b.getRow(1))

  // ---------- Descargar ----------
  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'ZURULLO WORLD CUP.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}
