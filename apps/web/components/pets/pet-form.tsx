'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { petSchema, type PetInput } from '@pawactivity/validation';
import { useForm } from 'react-hook-form';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

type PetFormProps = {
  action: string;
  submitLabel: string;
  defaultValues?: Partial<PetInput>;
};

export function PetForm({ action, submitLabel, defaultValues }: PetFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PetInput>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      breed: defaultValues?.breed ?? '',
      birthDate: defaultValues?.birthDate ?? '',
      weightKg: defaultValues?.weightKg ?? '',
      sex: defaultValues?.sex ?? 'unknown',
      photoUrl: defaultValues?.photoUrl ?? '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      ...values,
      breed: values.breed || undefined,
      birthDate: values.birthDate || undefined,
      weightKg: values.weightKg || undefined,
      photoUrl: values.photoUrl || undefined,
    };

    const response = await fetch(action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      alert(payload?.message ?? 'No se pudo guardar la mascota');
      return;
    }

    const payload = await response.json();
    window.location.href = payload.redirectTo;
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Nombre" error={errors.name?.message}>
        <input className="input" {...register('name')} />
      </Field>
      <Field label="Raza" error={errors.breed?.message}>
        <input className="input" {...register('breed')} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Fecha de nacimiento" error={errors.birthDate?.message}>
          <input className="input" type="date" {...register('birthDate')} />
        </Field>
        <Field label="Peso (kg)" error={errors.weightKg?.message}>
          <input className="input" type="number" step="0.1" {...register('weightKg')} />
        </Field>
      </div>
      <Field label="Sexo" error={errors.sex?.message}>
        <select className="input" {...register('sex')}>
          <option value="unknown">No especificado</option>
          <option value="male">Macho</option>
          <option value="female">Hembra</option>
        </select>
      </Field>
      <Field label="Foto (URL)" error={errors.photoUrl?.message}>
        <input className="input" {...register('photoUrl')} />
      </Field>
      <Button className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : submitLabel}
      </Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
