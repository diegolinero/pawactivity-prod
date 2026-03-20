'use client';

import { AppShell } from '@/components/layout/app-shell';
import { ErrorState } from '@/components/shared/error-state';

export default function DashboardError() {
  return (
    <AppShell>
      <ErrorState title="No pudimos cargar el dashboard" description="Intenta de nuevo en unos segundos." />
    </AppShell>
  );
}
