import { Card } from '@/components/ui/card';
import type { DeviceSummary } from '@pawactivity/types';

export function DeviceStatusCard({ device }: { device: DeviceSummary | null }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Dispositivo</h3>
      {device ? (
        <div className="mt-3 space-y-2 text-sm text-slate-600">
          <p><span className="font-medium text-slate-800">Serial:</span> {device.serialNumber}</p>
          <p><span className="font-medium text-slate-800">Estado:</span> {device.status}</p>
          <p><span className="font-medium text-slate-800">Batería:</span> {device.batteryLevel ?? 'Sin dato'}</p>
          <p><span className="font-medium text-slate-800">Última sync:</span> {device.lastSeenAt ?? 'Sin datos'}</p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-600">No hay dispositivo asociado.</p>
      )}
    </Card>
  );
}
