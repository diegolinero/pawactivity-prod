import { Card } from '@/components/ui/card';

export function SummaryStatCard({ title, value, accent }: { title: string; value: string; accent: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-semibold" style={{ color: accent }}>{value}</p>
    </Card>
  );
}
