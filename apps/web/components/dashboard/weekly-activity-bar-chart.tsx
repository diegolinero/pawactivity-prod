'use client';

import type { DailyActivitySummary } from '@pawactivity/types';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';

export function WeeklyActivityBarChart({ days }: { days: DailyActivitySummary[] }) {
  const data = days.map((day) => ({
    label: day.date.slice(5),
    activeMinutes: Math.round(day.totalActiveSeconds / 60),
  }));

  return (
    <Card className="p-5">
      <h3 className="text-lg font-semibold text-slate-900">Últimos 7 días</h3>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip formatter={(value: number) => `${value} min`} />
            <Bar dataKey="activeMinutes" fill="#0F766E" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
