'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { PetSummary } from '@pawactivity/types';

export function PetSelector({ pets, selectedPetId, basePath = '/dashboard' }: { pets: PetSummary[]; selectedPetId: string; basePath?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">Mascota</label>
      <select
        className="input min-w-[220px]"
        value={selectedPetId}
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set('petId', event.target.value);
          router.push(`${basePath}?${params.toString()}`);
        }}
      >
        {pets.map((pet) => (
          <option key={pet.id} value={pet.id}>
            {pet.name}
          </option>
        ))}
      </select>
    </div>
  );
}
