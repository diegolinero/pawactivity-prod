'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const options = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
] as const;

export function HistoryRangeSelector({ currentRange }: { currentRange: 'today' | 'week' | 'month' }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          className={`rounded-lg px-4 py-2 text-sm ${currentRange === option.value ? 'bg-white font-medium text-slate-900 shadow-sm' : 'text-slate-600'}`}
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('range', option.value);
            router.push(`/history?${params.toString()}`);
          }}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
