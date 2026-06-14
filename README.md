# Zurullo World Cup

Web de la polla del Mundial 2026 para 4 jugadores. Cada uno pone sus pronósticos
de cada partido y **a las 00:00 del día del partido se cierra automáticamente**
(no se puede modificar después). Calcula los puntos y la tabla solo.

- **Frontend:** React + Tailwind (se hospeda en GitHub Pages).
- **Backend:** Supabase (Postgres). El candado de hora, los PINs y el admin se
  validan en el servidor → no se puede hacer trampa desde el navegador.

---

## Puesta en marcha (una sola vez)

### 1. Crear el backend en Supabase
1. Entra a [supabase.com](https://supabase.com) y crea un proyecto gratis.
2. Ve a **SQL Editor → New query**, pega TODO el contenido de
   [`supabase/schema.sql`](supabase/schema.sql) y dale **Run**.
   Esto crea las tablas, las reglas anti-trampa y carga los 72 partidos.
3. Ve a **Project Settings → API** y copia:
   - **Project URL** (algo como `https://xxxx.supabase.co`)
   - **anon public** key (la clave larga)

### 2. Conectar la web
Abre [`src/config.ts`](src/config.ts) y pega ahí la URL y la anon key.
> Estos datos son públicos y seguros de exponer: toda la protección vive en la BD.

### 3. Probar en local
```bash
npm install
npm run dev
```
Abre la URL que muestra (http://localhost:5173).

### 4. Login y PINs
- En la pantalla de inicio cada jugador elige su nombre y escribe un PIN.
- **La primera vez que entras, el PIN que pongas queda guardado** como el tuyo.
- **Yisas** es el administrador: tiene la pestaña **Admin** para cargar los
  resultados reales y los bonus.

---

## Publicar en GitHub Pages
1. Sube este proyecto a un repo de GitHub (rama `main`).
2. En el repo: **Settings → Pages → Source = GitHub Actions**.
3. Cada vez que hagas `git push` a `main`, se publica solo
   (workflow en `.github/workflows/deploy.yml`).

---

## Cómo se usa
- **Pronósticos:** pones tu marcador por partido. Los pronósticos de los demás
  están ocultos (🔒) hasta que cierra cada partido, para que nadie copie.
- **Tabla:** posiciones en vivo con desempates.
- **Bonus:** campeón, subcampeón, goleador y peor selección (se cierran al
  empezar el Mundial).
- **Admin** (solo Yisas): carga resultados reales → la tabla se actualiza sola.
- **Reglas:** el reglamento.

## Reglas clave
- 3 pts marcador exacto · 1 pt acertar tendencia · 0 si fallas.
- Bonus: campeón +10, subcampeón +5, goleador +5.
- Cierre: 23:59 (hora Perú) del día antes de cada partido. Vacío = 0.
- Desempate: más exactos → acertar al campeón.
