import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <Card className="w-full max-w-md p-8">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </div>
      {children}
    </Card>
  );
}
