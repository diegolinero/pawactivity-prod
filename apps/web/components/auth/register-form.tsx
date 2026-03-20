'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { registerSchema } from '@pawactivity/validation';

type RegisterFormType = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      timezone: 'UTC',
    } satisfies RegisterFormType,
  });

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setError(null);

    const response = await fetch('/register/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      setError('No pudimos crear tu cuenta. Verifica los datos e inténtalo otra vez.');
      setLoading(false);
      return;
    }

    window.location.href = '/dashboard';
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
        <input className="w-full rounded-xl border border-slate-300 px-4 py-3" {...register('firstName')} />
        {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Apellido</label>
        <input className="w-full rounded-xl border border-slate-300 px-4 py-3" {...register('lastName')} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <input className="w-full rounded-xl border border-slate-300 px-4 py-3" type="email" {...register('email')} />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña</label>
        <input className="w-full rounded-xl border border-slate-300 px-4 py-3" type="password" {...register('password')} />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button className="w-full" disabled={loading}>
        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
      </Button>
      <p className="text-sm text-slate-600">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-medium text-brand">
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
