'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { deviceActivationSchema } from '@pawactivity/validation';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';

type FormValues = z.infer<typeof deviceActivationSchema>;

export function DeviceActivationForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(deviceActivationSchema),
    defaultValues: {
      serialNumber: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const response = await fetch('/devices/actions/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setFormError(payload?.message ?? 'No se pudo activar el dispositivo');
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
      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
      <Button className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Activando...' : 'Activar dispositivo'}
      </Button>
    </form>
  );
}
