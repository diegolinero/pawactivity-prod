import { Card } from '@/components/ui/card';

export function ActivityComparisonCard({ todaySeconds, yesterdaySeconds }: { todaySeconds: number; yesterdaySeconds: number }) {
  const change = yesterdaySeconds > 0 ? Math.round(((todaySeconds - yesterdaySeconds) / yesterdaySeconds) * 100) : null;
  const text = change === null ? 'Aún no hay suficientes datos para comparar con ayer.' : `${change >= 0 ? '+' : ''}${change}% de actividad vs ayer`;

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Comparación</h3>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{text}</p>
      <p className="mt-2 text-sm text-slate-600">Se compara el total activo de hoy contra el último día disponible.</p>
    </Card>
  );
}
