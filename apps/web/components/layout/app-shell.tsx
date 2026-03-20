import Link from 'next/link';
import type { ReactNode } from 'react';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <Link href="/dashboard" className="text-lg font-semibold text-slate-900">
            PawActivity
          </Link>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <nav className="flex flex-wrap items-center gap-4">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/pets">Mascotas</Link>
              <Link href="/devices">Dispositivos</Link>
              <Link href="/history">Historial</Link>
            </nav>
            <form action="/logout" method="post">
              <button className="rounded-lg border border-slate-300 px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-100" type="submit">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
