'use client';

import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';

const COLORS = {
  rest: '#60A5FA',
  walk: '#22C55E',
  run: '#F97316',
};

export function ActivityDonutChart({ restSeconds, walkSeconds, runSeconds }: { restSeconds: number; walkSeconds: number; runSeconds: number }) {
  const data = [
    { name: 'Reposo', value: restSeconds, color: COLORS.rest },
    { name: 'Caminar', value: walkSeconds, color: COLORS.walk },
    { name: 'Correr', value: runSeconds, color: COLORS.run },
  ];

  return (
    <Card className="p-5">
      <h3 className="text-lg font-semibold text-slate-900">Distribución diaria</h3>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={70} outerRadius={100} paddingAngle={4}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatMinutes(value)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {data.map((item) => (
          <div key={item.name} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</div>
            <p className="mt-2 font-medium text-slate-900">{formatMinutes(item.value)}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function formatMinutes(seconds: number) {
  return `${Math.round(seconds / 60)} min`;
}
