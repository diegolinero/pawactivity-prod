'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { deviceAssignmentSchema } from '@pawactivity/validation';
import type { DeviceSummary } from '@pawactivity/types';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';

type DeviceAssignmentFormType = z.infer<typeof deviceAssignmentSchema>;

export function DeviceAssignmentForm({ petId, devices }: { petId: string; devices: DeviceSummary[] }) {
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(deviceAssignmentSchema),
    defaultValues: {
      deviceId: '',
    } satisfies DeviceAssignmentFormType,
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const response = await fetch(`/pets/${petId}/assign-device`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setFormError(payload?.message ?? 'No se pudo asignar el dispositivo');
      return;
    }

    window.location.reload();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Dispositivo disponible</label>
        <select className="input" {...register('deviceId')}>
          <option value="">Selecciona un dispositivo</option>
          {devices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.serialNumber} · {device.status}
            </option>
          ))}
        </select>
        {errors.deviceId ? <p className="mt-1 text-sm text-red-600">{errors.deviceId.message}</p> : null}
      </div>
      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
      <Button className="w-full" disabled={isSubmitting || devices.length === 0}>
        {isSubmitting ? 'Asignando...' : 'Asignar dispositivo'}
      </Button>
    </form>
  );
}
