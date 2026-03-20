import type { DailyActivitySummary } from '@pawactivity/types';
import { Card } from '@/components/ui/card';

export function HistoryDayCard({ day }: { day: DailyActivitySummary }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{day.date}</h3>
          <p className="mt-1 text-sm text-slate-600">Total activo: {Math.round(day.totalActiveSeconds / 60)} min</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 text-sm text-slate-600">
          <div>Reposo: <span className="font-medium text-slate-900">{Math.round(day.restSeconds / 60)} min</span></div>
          <div>Caminar: <span className="font-medium text-slate-900">{Math.round(day.walkSeconds / 60)} min</span></div>
          <div>Correr: <span className="font-medium text-slate-900">{Math.round(day.runSeconds / 60)} min</span></div>
        </div>
      </div>
    </Card>
  );
}
