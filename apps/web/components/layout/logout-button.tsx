'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await fetch('/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch {
      // ignore client-side network/logout errors and force local navigation
    } finally {
      router.replace('/login');
      router.refresh();
      window.location.assign('/login');
    }
  }

  return (
    <button
      className="rounded-lg border border-slate-300 px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
      onClick={handleLogout}
      type="button"
      disabled={isLoggingOut}
    >
      {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
    </button>
  );
}
