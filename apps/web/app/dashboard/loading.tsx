import { AppShell } from '@/components/layout/app-shell';
import { LoadingState } from '@/components/shared/loading-state';

export default function DashboardLoading() {
  return (
    <AppShell>
      <LoadingState title="Cargando dashboard" />
    </AppShell>
  );
}
