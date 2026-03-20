import { redirect } from 'next/navigation';
import { AuthCard } from '@/components/auth/auth-card';
import { RegisterForm } from '@/components/auth/register-form';
import { getAccessToken } from '@/lib/session';

export default async function RegisterPage() {
  const token = await getAccessToken();
  if (token) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <AuthCard title="Crear cuenta" subtitle="Configura tu acceso a la plataforma privada de PawActivity.">
        <RegisterForm />
      </AuthCard>
    </main>
  );
}
