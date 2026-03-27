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

function toTimezoneDateKey(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('No se pudo resolver la fecha local para el timezone del usuario.');
  }

  return `${year}-${month}-${day}`;
}

function shiftDateKey(dateKey: string, days: number) {
  const DAY_IN_MS = 24 * 60 * 60 * 1000;
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  const shifted = new Date(date.getTime() + days * DAY_IN_MS);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDashboardDateKeys(timezone: string) {
  const today = toTimezoneDateKey(new Date(), timezone);
  return {
    today,
    yesterday: shiftDateKey(today, -1),
    weekStart: shiftDateKey(today, -6),
  };
}

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

  const firstPet = pets[0];

  if (!firstPet) {
    redirect('/pets');
  }

  const selectedPetId =
    params.petId && pets.some((pet) => pet.id === params.petId)
      ? params.petId
      : firstPet.id;

  const pet = pets.find((item) => item.id === selectedPetId) ?? firstPet;

  const userTimezone = user.timezone ?? 'UTC';
  const { today, yesterday, weekStart } = getDashboardDateKeys(userTimezone);
  const timezoneParam = encodeURIComponent(userTimezone);

  const activeDevice = pet.activeDevice;

  const [daily, previousDaily, weekly, timeline, deviceStatus] = await withSessionRedirect(() => Promise.all([
    apiFetchWithSession<DailyActivitySummary>(`/pets/${pet.id}/activity/daily?date=${today}&timezone=${timezoneParam}`),
    apiFetchWithSession<DailyActivitySummary>(`/pets/${pet.id}/activity/daily?date=${yesterday}&timezone=${timezoneParam}`),
    apiFetchWithSession<WeeklyActivityResponse>(`/pets/${pet.id}/activity/weekly?startDate=${weekStart}&timezone=${timezoneParam}`),
    apiFetchWithSession<ActivityTimelineItem[]>(`/pets/${pet.id}/activity/timeline?date=${today}&timezone=${timezoneParam}`),
    activeDevice ? apiFetchWithSession<DeviceSummary>(`/devices/${activeDevice.id}`) : Promise.resolve(null),
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
