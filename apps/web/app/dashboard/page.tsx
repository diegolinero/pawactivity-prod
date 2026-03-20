import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { getAccessToken } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const token = await getAccessToken();
  if (!token) {
    redirect('/login');
  }

  return (
    <AppShell>
      <section className="space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-brand">Fase 2</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Base funcional del producto</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Ya puedes gestionar mascotas, activar dispositivos y asignarlos a cada perro desde la plataforma privada.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Mascotas', 'Ver, crear y editar mascotas', '/pets'],
            ['Dispositivos', 'Activar y revisar estado básico', '/devices'],
            ['Siguiente fase', 'Sincronización de actividad', '#'],
          ].map(([title, description, href]) => (
            <Card key={title} className="p-5">
              <h2 className="font-medium text-slate-900">{title}</h2>
              <p className="mt-2 text-sm text-slate-600">{description}</p>
              {href !== '#' ? (
                <Link href={href} className="mt-4 inline-block text-sm font-medium text-brand">
                  Ir ahora
                </Link>
              ) : (
                <p className="mt-4 text-sm font-medium text-slate-400">Próximamente</p>
              )}
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
