import type { PetSummary } from '@pawactivity/types';
import { Card } from '@/components/ui/card';

export function PetProfileHeader({ pet }: { pet: PetSummary }) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-brand">Perfil de mascota</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{pet.name}</h1>
          <p className="mt-2 text-sm text-slate-600">{pet.breed || 'Raza no especificada'} · {pet.sex}</p>
        </div>
        {pet.photoUrl ? (
          <img src={pet.photoUrl} alt={pet.name} className="h-24 w-24 rounded-2xl object-cover" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-brand-soft text-sm font-medium text-brand-dark">Sin foto</div>
        )}
      </div>
    </Card>
  );
}
