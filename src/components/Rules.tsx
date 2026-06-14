import type { ReactNode } from 'react'

export default function Rules() {
  const Item = ({ title, children }: { title: string; children: ReactNode }) => (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="mb-2 font-bold text-green-400">{title}</h3>
      <div className="space-y-1 text-sm text-white/80">{children}</div>
    </div>
  )
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black">📜 Reglamento Oficial</h2>

      <Item title="1. Puntuación base">
        <p><b className="text-green-400">Acierto perfecto (3 pts):</b> marcador exacto. Ej: 2-1 y queda 2-1.</p>
        <p><b className="text-yellow-300">Tendencia (1 pt):</b> aciertas ganador o empate, pero no los goles.</p>
        <p><b className="text-red-400">Error total (0 pts):</b> no aciertas nada.</p>
      </Item>

      <Item title="2. Regla de los 90 minutos (eliminatorias)">
        <p>En octavos en adelante cuenta el resultado de los 90' + descuento + prórroga. Los penales cuentan para el marcador. No se permiten empates: si pusiste 2-1 y se va a penales, solo puedes sacar 1 pt (tendencia) o 0.</p>
      </Item>

      <Item title="3. Puntos bonus (antes del Mundial)">
        <p>Acertar al campeón: <b>+10</b></p>
        <p>Acertar al subcampeón: <b>+5</b></p>
        <p>Acertar al máximo goleador (Bota de Oro): <b>+5</b> (si hay empate en la realidad, se da a todos los que tengan a uno de los goleadores).</p>
      </Item>

      <Item title="4. Plazos de entrega">
        <p>Los pronósticos se pueden llenar <b>hasta las 23:59 del día antes</b> del partido (hora Perú). A esa hora la app bloquea automáticamente cada partido. Casilla vacía al cerrar = <b>0 puntos</b>.</p>
      </Item>

      <Item title="5. Criterios de desempate">
        <p>Si dos o más terminan con los mismos puntos, gana:</p>
        <p>1) Quien tenga más <b>marcadores exactos</b> (de 3 pts).</p>
        <p>2) Quien haya <b>acertado al campeón</b> en el bonus.</p>
      </Item>

      <Item title="6. Bonus peor selección">
        <p>Cada uno elige 1 de las 10 peores selecciones del Mundial.</p>
        <p>3 goles en contra = 1 pt · 1 gol a favor = 1 pt.</p>
        <p>El ganador come gratis en la gran salida del 22 :u</p>
      </Item>
    </div>
  )
}
