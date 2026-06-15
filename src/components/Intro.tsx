import type { ReactNode } from 'react'

// Cajita de ayuda que explica qué hacer en cada panel.
export default function Intro({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/70">
      <p className="mb-1 font-bold text-white">{title}</p>
      {children}
    </div>
  )
}
