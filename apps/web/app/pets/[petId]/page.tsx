import Link from 'next/link';
import type { DeviceSummary, PetSummary } from '@pawactivity/types';
import { AppShell } from '@/components/layout/app-shell';
import { DeviceAssignmentForm } from '@/components/devices/device-assignment-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetchWithSession } from '@/lib/server-api';
import { getAccessToken } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function PetDetailPage({ params }: { params: Promise<{ petId: string }> }) {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const { petId } = await params;
  const [pet, devices] = await Promise.all([
    apiFetchWithSession<PetSummary>(`/pets/${petId}`),
    apiFetchWithSession<DeviceSummary[]>('/devices'),
  ]);

  const availableDevices = devices.filter((device) => !device.assignedPet || device.assignedPet.id === pet.id);

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">{pet.name}</h1>
          <p className="mt-2 text-slate-600">Detalle de mascota y relación con su dispositivo.</p>
        </div>
        <Link href={`/pets/${pet.id}/edit`}>
          <Button>Editar mascota</Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900">Datos principales</h2>
          <dl className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
            <div><dt className="font-medium text-slate-800">Raza</dt><dd>{pet.breed || 'Sin registrar'}</dd></div>
            <div><dt className="font-medium text-slate-800">Sexo</dt><dd>{pet.sex}</dd></div>
            <div><dt className="font-medium text-slate-800">Fecha de nacimiento</dt><dd>{pet.birthDate || 'Sin registrar'}</dd></div>
            <div><dt className="font-medium text-slate-800">Peso</dt><dd>{pet.weightKg ? `${pet.weightKg} kg` : 'Sin registrar'}</dd></div>
            <div className="md:col-span-2"><dt className="font-medium text-slate-800">Foto</dt><dd>{pet.photoUrl || 'Sin registrar'}</dd></div>
          </dl>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900">Dispositivo asociado</h2>
            {pet.activeDevice ? (
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p><span className="font-medium text-slate-800">Serial:</span> {pet.activeDevice.serialNumber}</p>
                <p><span className="font-medium text-slate-800">Modelo:</span> {pet.activeDevice.model}</p>
                <p><span className="font-medium text-slate-800">Estado:</span> {pet.activeDevice.status}</p>
                <p><span className="font-medium text-slate-800">Batería:</span> {pet.activeDevice.batteryLevel ?? 'Sin dato'}</p>
                <p><span className="font-medium text-slate-800">Última señal:</span> {pet.activeDevice.lastSeenAt ?? 'Sin dato'}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">Todavía no hay un dispositivo asignado a esta mascota.</p>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900">Asignar dispositivo</h2>
            <p className="mt-2 text-sm text-slate-600">
              La asignación se hace desde la mascota para mantener claro qué dispositivo queda activo para cada perro.
            </p>
            <div className="mt-4">
              <DeviceAssignmentForm petId={pet.id} devices={availableDevices} />
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
