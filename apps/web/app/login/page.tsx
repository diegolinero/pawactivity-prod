import { redirect } from 'next/navigation';
import { AuthCard } from '@/components/auth/auth-card';
import { LoginForm } from '@/components/auth/login-form';
import { getAccessToken } from '@/lib/session';

export default async function LoginPage() {
  const token = await getAccessToken();
  if (token) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <AuthCard title="Bienvenido" subtitle="Inicia sesión para acceder a tu panel privado de PawActivity.">
        <LoginForm />
      </AuthCard>
    </main>
  );
}
