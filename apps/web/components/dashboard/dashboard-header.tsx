import type { AuthUser, DeviceSummary, PetSummary } from '@pawactivity/types';
import { Card } from '@/components/ui/card';
import { PetSelector } from './pet-selector';

export function DashboardHeader({
  user,
  pets,
  selectedPetId,
  device,
}: {
  user: AuthUser;
  pets: PetSummary[];
  selectedPetId: string;
  device: DeviceSummary | null;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
      <Card className="p-6">
        <p className="text-sm font-medium uppercase tracking-wide text-brand">PawActivity</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Hola, {user.firstName}</h1>
        <p className="mt-2 text-sm text-slate-600">Consulta la actividad reciente de tu perro y valida si la última sincronización llegó correctamente.</p>
      </Card>
      <Card className="p-6">
        <PetSelector pets={pets} selectedPetId={selectedPetId} />
        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <p><span className="font-medium text-slate-800">Última sync:</span> {device?.lastSeenAt ?? 'Sin datos'}</p>
          <p><span className="font-medium text-slate-800">Estado:</span> {device?.status ?? 'Sin dispositivo'}</p>
          <p><span className="font-medium text-slate-800">Batería:</span> {device?.batteryLevel ?? 'Sin dato'}</p>
        </div>
        <p className="mt-4 text-xs text-slate-500">Si la hora de última sync no cambia después de una prueba real, revisa Android, BLE y asignación del dispositivo.</p>
      </Card>
    </div>
  );
}
