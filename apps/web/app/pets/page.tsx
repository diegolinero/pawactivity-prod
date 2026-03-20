import Link from 'next/link';
import type { PetSummary } from '@pawactivity/types';
import { AppShell } from '@/components/layout/app-shell';
import { PetCard } from '@/components/pets/pet-card';
import { Button } from '@/components/ui/button';
import { apiFetchWithSession, withSessionRedirect } from '@/lib/server-api';
import { getAccessToken } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function PetsPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const pets = await withSessionRedirect(() => apiFetchWithSession<PetSummary[]>('/pets'));

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Mascotas</h1>
          <p className="mt-2 text-slate-600">Administra las mascotas registradas en tu cuenta.</p>
        </div>
        <Link href="/pets/new">
          <Button>Nueva mascota</Button>
        </Link>
      </div>

      {pets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Aún no tienes mascotas registradas</h2>
          <p className="mt-2 text-sm text-slate-600">Crea tu primera mascota para empezar a preparar el flujo del producto.</p>
          <div className="mt-6">
            <Link href="/pets/new">
              <Button>Crear mascota</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
