import Link from 'next/link';
import type { ReactNode } from 'react';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-lg font-semibold text-slate-900">
            PawActivity
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate-600">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/pets">Mascotas</Link>
            <Link href="/devices">Dispositivos</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
