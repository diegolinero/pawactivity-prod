import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { PetForm } from '@/components/pets/pet-form';
import { getAccessToken } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function NewPetPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-slate-900">Nueva mascota</h1>
          <p className="mt-2 text-slate-600">Registra la mascota para empezar a asociarla con su dispositivo.</p>
        </div>
        <Card className="p-6">
          <PetForm action="/pets/new/actions" submitLabel="Guardar mascota" />
        </Card>
      </div>
    </AppShell>
  );
}
