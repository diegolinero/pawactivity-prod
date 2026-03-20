import type { DeviceSummary } from '@pawactivity/types';
import { AppShell } from '@/components/layout/app-shell';
import { DeviceActivationForm } from '@/components/devices/device-activation-form';
import { Card } from '@/components/ui/card';
import { apiFetchWithSession } from '@/lib/server-api';
import { getAccessToken } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function DevicesPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const devices = await apiFetchWithSession<DeviceSummary[]>('/devices');

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-slate-900">Dispositivos</h1>
        <p className="mt-2 text-slate-600">Activa dispositivos por serial y revisa su estado básico.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900">Activar dispositivo</h2>
          <p className="mt-2 text-sm text-slate-600">Ingresa el serial para dejarlo disponible en tu cuenta.</p>
          <div className="mt-4">
            <DeviceActivationForm />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900">Mis dispositivos</h2>
          {devices.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">Todavía no hay dispositivos activados.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {devices.map((device) => (
                <div key={device.id} className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
                  <p><span className="font-medium text-slate-800">Serial:</span> {device.serialNumber}</p>
                  <p><span className="font-medium text-slate-800">Estado:</span> {device.status}</p>
                  <p><span className="font-medium text-slate-800">Modelo:</span> {device.model}</p>
                  <p><span className="font-medium text-slate-800">Mascota asignada:</span> {device.assignedPet?.name ?? 'Sin asignar'}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
