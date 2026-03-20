import Link from 'next/link';
import type { DeviceSummary, PetSummary, WeeklyActivityResponse } from '@pawactivity/types';
import { DeviceAssignmentForm } from '@/components/devices/device-assignment-form';
import { DeviceStatusCard } from '@/components/dashboard/device-status-card';
import { AppShell } from '@/components/layout/app-shell';
import { PetProfileHeader } from '@/components/pets/pet-profile-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetchWithSession, withSessionRedirect } from '@/lib/server-api';
import { getAccessToken } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function PetDetailPage({ params }: { params: Promise<{ petId: string }> }) {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const { petId } = await params;
  const [pet, devices, weeklySummary] = await withSessionRedirect(() => Promise.all([
    apiFetchWithSession<PetSummary>(`/pets/${petId}`),
    apiFetchWithSession<DeviceSummary[]>('/devices'),
    apiFetchWithSession<WeeklyActivityResponse>(`/pets/${petId}/activity/weekly?startDate=${new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)}`),
  ]));

  const deviceStatus = pet.activeDevice
    ? await withSessionRedirect(() => apiFetchWithSession<DeviceSummary>(`/devices/${pet.activeDevice.id}/status`))
    : null;
  const availableDevices = devices.filter((device) => !device.assignedPet || device.assignedPet.id === pet.id);
  const weeklyTotals = weeklySummary.days.reduce(
    (acc, day) => {
      acc.restSeconds += day.restSeconds;
      acc.walkSeconds += day.walkSeconds;
      acc.runSeconds += day.runSeconds;
      acc.totalActiveSeconds += day.totalActiveSeconds;
      return acc;
    },
    { restSeconds: 0, walkSeconds: 0, runSeconds: 0, totalActiveSeconds: 0 },
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <PetProfileHeader pet={pet} />

        <div className="flex justify-end">
          <Link href={`/pets/${pet.id}/edit`}>
            <Button>Editar mascota</Button>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900">Datos principales</h2>
            <dl className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
              <div><dt className="font-medium text-slate-800">Raza</dt><dd>{pet.breed || 'Sin registrar'}</dd></div>
              <div><dt className="font-medium text-slate-800">Sexo</dt><dd>{pet.sex}</dd></div>
              <div><dt className="font-medium text-slate-800">Fecha de nacimiento</dt><dd>{pet.birthDate || 'Sin registrar'}</dd></div>
              <div><dt className="font-medium text-slate-800">Peso</dt><dd>{pet.weightKg ? `${pet.weightKg} kg` : 'Sin registrar'}</dd></div>
            </dl>
          </Card>

          <DeviceStatusCard device={deviceStatus} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900">Resumen semanal</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-slate-600">
              <div>Reposo: <span className="font-medium text-slate-900">{Math.round(weeklyTotals.restSeconds / 60)} min</span></div>
              <div>Caminar: <span className="font-medium text-slate-900">{Math.round(weeklyTotals.walkSeconds / 60)} min</span></div>
              <div>Correr: <span className="font-medium text-slate-900">{Math.round(weeklyTotals.runSeconds / 60)} min</span></div>
              <div>Total activo: <span className="font-medium text-slate-900">{Math.round(weeklyTotals.totalActiveSeconds / 60)} min</span></div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900">Asignar dispositivo</h2>
            <p className="mt-2 text-sm text-slate-600">Selecciona qué dispositivo debe quedar asociado activamente a esta mascota.</p>
            <div className="mt-4">
              <DeviceAssignmentForm petId={pet.id} devices={availableDevices} />
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
