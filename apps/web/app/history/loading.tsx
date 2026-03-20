import { AppShell } from '@/components/layout/app-shell';
import { LoadingState } from '@/components/shared/loading-state';

export default function HistoryLoading() {
  return (
    <AppShell>
      <LoadingState title="Cargando historial" />
    </AppShell>
  );
}
