import type { ActivityTimelineItem } from '@pawactivity/types';
import { Card } from '@/components/ui/card';

const labels = {
  rest: 'Reposo',
  walk: 'Caminar',
  run: 'Correr',
};

export function ActivityTimeline({ items }: { items: ActivityTimelineItem[] }) {
  return (
    <Card className="p-5">
      <h3 className="text-lg font-semibold text-slate-900">Timeline del día</h3>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">Todavía no hay eventos registrados para este día.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4 text-sm">
              <div>
                <p className="font-medium text-slate-900">{labels[item.activityType]}</p>
                <p className="mt-1 text-slate-600">{formatHour(item.startedAt)} → {formatHour(item.endedAt)}</p>
              </div>
              <div className="text-right text-slate-600">
                <p>{Math.round(item.durationSeconds / 60)} min</p>
                <p>{item.confidence != null ? `${Math.round(item.confidence * 100)}% conf.` : 'Sin confianza'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function formatHour(value: string) {
  return new Date(value).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}
