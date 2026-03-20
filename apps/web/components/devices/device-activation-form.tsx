'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { deviceActivationSchema, type DeviceActivationInput } from '@pawactivity/validation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';

export function DeviceActivationForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<DeviceActivationInput>({
    resolver: zodResolver(deviceActivationSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    const response = await fetch('/devices/actions/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      alert(payload?.message ?? 'No se pudo activar el dispositivo');
      return;
    }

    window.location.reload();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Serial del dispositivo</label>
        <input className="input" {...register('serialNumber')} />
        {errors.serialNumber && <p className="mt-1 text-sm text-red-600">{errors.serialNumber.message}</p>}
      </div>
      <Button className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Activando...' : 'Activar dispositivo'}
      </Button>
    </form>
  );
}
