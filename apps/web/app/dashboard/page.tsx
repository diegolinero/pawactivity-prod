import type { AuthUser, DailyActivitySummary, DeviceSummary, PetSummary, WeeklyActivityResponse, ActivityTimelineItem } from '@pawactivity/types';
import { ActivityComparisonCard } from '@/components/dashboard/activity-comparison-card';
import { ActivityDonutChart } from '@/components/dashboard/activity-donut-chart';
import { ActivityTimeline } from '@/components/dashboard/activity-timeline';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DeviceStatusCard } from '@/components/dashboard/device-status-card';
import { SummaryStatCard } from '@/components/dashboard/summary-stat-card';
import { WeeklyActivityBarChart } from '@/components/dashboard/weekly-activity-bar-chart';
import { AppShell } from '@/components/layout/app-shell';
import { EmptyState } from '@/components/shared/empty-state';
import { apiFetchWithSession, withSessionRedirect } from '@/lib/server-api';
import { getAccessToken } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ petId?: string }> }) {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const [user, pets, params] = await withSessionRedirect(() => Promise.all([
    apiFetchWithSession<AuthUser>('/auth/me'),
    apiFetchWithSession<PetSummary[]>('/pets'),
    searchParams,
  ]));

  if (pets.length === 0) {
    return (
      <AppShell>
        <EmptyState
          title="Aún no tienes mascotas registradas"
          description="Crea una mascota para empezar a visualizar actividad en el dashboard."
          actionLabel="Crear mascota"
          actionHref="/pets/new"
        />
      </AppShell>
    );
  }

  const selectedPetId = params.petId && pets.some((pet) => pet.id === params.petId) ? params.petId : pets[0].id;
  const pet = pets.find((item) => item.id === selectedPetId) ?? pets[0];
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const weekStart = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

  const [daily, previousDaily, weekly, timeline, deviceStatus] = await withSessionRedirect(() => Promise.all([
    apiFetchWithSession<DailyActivitySummary>(`/pets/${pet.id}/activity/daily?date=${today}`),
    apiFetchWithSession<DailyActivitySummary>(`/pets/${pet.id}/activity/daily?date=${yesterday}`),
    apiFetchWithSession<WeeklyActivityResponse>(`/pets/${pet.id}/activity/weekly?startDate=${weekStart}`),
    apiFetchWithSession<ActivityTimelineItem[]>(`/pets/${pet.id}/activity/timeline?date=${today}&timezone=${encodeURIComponent(user.timezone)}`),
    pet.activeDevice ? apiFetchWithSession<DeviceSummary>(`/devices/${pet.activeDevice.id}`) : Promise.resolve(null),
  ]));

  const hasData = daily.hasData || weekly.days.some((day) => day.hasData) || timeline.length > 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <DashboardHeader user={user} pets={pets} selectedPetId={pet.id} device={deviceStatus} />

        {!hasData ? (
          <EmptyState
            title="Todavía no hay actividad sincronizada"
            description="Cuando la app móvil envíe eventos, aquí verás el resumen diario, el gráfico semanal y el timeline del día."
            actionLabel="Ver dispositivos"
            actionHref="/devices"
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryStatCard title="Reposo hoy" value={`${Math.round(daily.restSeconds / 60)} min`} accent="#60A5FA" />
              <SummaryStatCard title="Caminar hoy" value={`${Math.round(daily.walkSeconds / 60)} min`} accent="#22C55E" />
              <SummaryStatCard title="Correr hoy" value={`${Math.round(daily.runSeconds / 60)} min`} accent="#F97316" />
              <SummaryStatCard title="Total activo hoy" value={`${Math.round(daily.totalActiveSeconds / 60)} min`} accent="#0F766E" />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <ActivityDonutChart restSeconds={daily.restSeconds} walkSeconds={daily.walkSeconds} runSeconds={daily.runSeconds} />
              <div className="space-y-6">
                <DeviceStatusCard device={deviceStatus} />
                <ActivityComparisonCard todaySeconds={daily.totalActiveSeconds} yesterdaySeconds={previousDaily.totalActiveSeconds} />
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <WeeklyActivityBarChart days={weekly.days} />
              <ActivityTimeline items={timeline} />
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
