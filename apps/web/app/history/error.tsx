'use client';

import { AppShell } from '@/components/layout/app-shell';
import { ErrorState } from '@/components/shared/error-state';

export default function HistoryError() {
  return (
    <AppShell>
      <ErrorState title="No pudimos cargar el historial" description="Revisa la sesión o vuelve a intentarlo." />
    </AppShell>
  );
}
