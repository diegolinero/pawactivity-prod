import Link from 'next/link';
import { Card } from '@/components/ui/card';
import type { PetSummary } from '@pawactivity/types';

export function PetCard({ pet }: { pet: PetSummary }) {
  return (
    <Card className="p-5">
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{pet.name}</h2>
          <p className="text-sm text-slate-600">{pet.breed || 'Raza no especificada'}</p>
        </div>
        <div className="text-sm text-slate-600">
          <p>Sexo: {labelSex(pet.sex)}</p>
          <p>Peso: {pet.weightKg ? `${pet.weightKg} kg` : 'Sin registrar'}</p>
          <p>Dispositivo: {pet.activeDevice ? pet.activeDevice.serialNumber : 'Sin asignar'}</p>
        </div>
        <Link href={`/pets/${pet.id}`} className="text-sm font-medium text-brand">
          Ver detalle
        </Link>
      </div>
    </Card>
  );
}

function labelSex(value: PetSummary['sex']) {
  return value === 'male' ? 'Macho' : value === 'female' ? 'Hembra' : 'No especificado';
}
