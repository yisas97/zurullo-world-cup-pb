export default function NotConfigured() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-6 text-sm">
        <h1 className="mb-3 text-xl font-black">Zurullo World Cup</h1>
        <p className="mb-3 text-white/80">Falta conectar Supabase. Para que funcione:</p>
        <ol className="list-decimal space-y-2 pl-5 text-white/70">
          <li>Crea un proyecto gratis en <b>supabase.com</b>.</li>
          <li>En <b>SQL Editor</b>, pega y ejecuta el archivo <code className="rounded bg-black/40 px-1">supabase/schema.sql</code>.</li>
          <li>Copia la <b>URL</b> y la <b>anon key</b> (Project Settings → API) en <code className="rounded bg-black/40 px-1">src/config.ts</code>.</li>
        </ol>
        <p className="mt-4 text-xs text-white/40">Lee el <b>README.md</b> para el paso a paso completo.</p>
      </div>
    </div>
  )
}
