import type { PetSummary } from '@pawactivity/types';
import { AppShell } from '@/components/layout/app-shell';
import { PetForm } from '@/components/pets/pet-form';
import { Card } from '@/components/ui/card';
import { apiFetchWithSession } from '@/lib/server-api';
import { getAccessToken } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function EditPetPage({ params }: { params: Promise<{ petId: string }> }) {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const { petId } = await params;
  const pet = await apiFetchWithSession<PetSummary>(`/pets/${petId}`);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-slate-900">Editar mascota</h1>
          <p className="mt-2 text-slate-600">Actualiza los datos principales de {pet.name}.</p>
        </div>
        <Card className="p-6">
          <PetForm
            action={`/pets/${pet.id}/edit/actions`}
            submitLabel="Guardar cambios"
            defaultValues={{
              name: pet.name,
              breed: pet.breed ?? '',
              birthDate: pet.birthDate ?? '',
              weightKg: pet.weightKg ?? '',
              sex: pet.sex,
              photoUrl: pet.photoUrl ?? '',
            }}
          />
        </Card>
      </div>
    </AppShell>
  );
}
