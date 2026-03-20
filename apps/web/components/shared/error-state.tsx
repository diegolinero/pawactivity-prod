'use client';

import { Button } from '@/components/ui/button';

export function ErrorState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <h2 className="text-lg font-semibold text-red-900">{title}</h2>
      <p className="mt-2 text-sm text-red-700">{description}</p>
      <div className="mt-6">
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    </div>
  );
}
