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
          <p className="text-sm font-medium uppercase tracking-wide text-brand">Fase 1</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Dashboard base</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            La autenticación y la estructura base del producto ya están preparadas. El dashboard completo llegará en la siguiente etapa.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Estado de la cuenta', 'Autenticación lista'],
            ['API', 'Conectada vía endpoints /v1/auth'],
            ['Siguiente fase', 'Mascotas, dispositivos y datos'],
          ].map(([title, description]) => (
            <Card key={title} className="p-5">
              <h2 className="font-medium text-slate-900">{title}</h2>
              <p className="mt-2 text-sm text-slate-600">{description}</p>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
