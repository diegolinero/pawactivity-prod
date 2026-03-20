import type { DailyActivitySummary, PetSummary } from '@pawactivity/types';
import { HistoryDayCard } from '@/components/history/history-day-card';
import { HistoryRangeSelector } from '@/components/history/history-range-selector';
import { PetSelector } from '@/components/dashboard/pet-selector';
import { AppShell } from '@/components/layout/app-shell';
import { EmptyState } from '@/components/shared/empty-state';
import { apiFetchWithSession, withSessionRedirect } from '@/lib/server-api';
import { getAccessToken } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ petId?: string; range?: 'today' | 'week' | 'month' }> }) {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const [pets, params] = await withSessionRedirect(() => Promise.all([
    apiFetchWithSession<PetSummary[]>('/pets'),
    searchParams,
  ]));

  if (pets.length === 0) {
    return (
      <AppShell>
        <EmptyState
          title="Necesitas una mascota para ver historial"
          description="Crea una mascota y sincroniza actividad para empezar a usar esta vista."
          actionLabel="Crear mascota"
          actionHref="/pets/new"
        />
      </AppShell>
    );
  }

  const range = params.range ?? 'week';
  const petId = params.petId && pets.some((pet) => pet.id === params.petId) ? params.petId : pets[0].id;
  const history = await withSessionRedirect(() => apiFetchWithSession<DailyActivitySummary[]>(`/pets/${petId}/activity/history?range=${range}`));

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Historial</h1>
            <p className="mt-2 text-slate-600">Explora los días recientes con actividad registrada.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PetSelector pets={pets} selectedPetId={petId} basePath="/history" />
            <HistoryRangeSelector currentRange={range} />
          </div>
        </div>

        {history.length === 0 ? (
          <EmptyState title="Sin datos todavía" description="Aún no hay resúmenes disponibles para el rango seleccionado." />
        ) : (
          <div className="space-y-4">
            {history.map((day) => (
              <HistoryDayCard key={day.date} day={day} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
