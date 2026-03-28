import test from 'node:test';
import assert from 'node:assert/strict';
import { ForbiddenException } from '@nestjs/common';
import { PetRecordsService } from '../src/modules/pet-records/pet-records.service';

function createPetRecordsService() {
  const pets = [{ id: 'pet-1', userId: 'user-1', weightKg: null as any }];
  const weights: any[] = [];
  const vaccinations: any[] = [];
  const dewormings: any[] = [];
  const vetVisits: any[] = [];

  let sequence = 0;
  const now = () => new Date('2026-03-28T12:00:00.000Z');
  const applyDefined = (target: Record<string, unknown>, data: Record<string, unknown>) => {
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        target[key] = value;
      }
    });
  };

  const prisma = {
    pet: {
      findUniqueOrThrow: async ({ where }: any) => {
        const pet = pets.find((item) => item.id === where.id);
        if (!pet) throw new Error('Pet not found');
        return { id: pet.id, weightKg: pet.weightKg };
      },
      update: async ({ where, data }: any) => {
        const pet = pets.find((item) => item.id === where.id)!;
        pet.weightKg = data.weightKg;
        return pet;
      },
    },
    petWeightRecord: {
      findMany: async ({ where }: any) => weights.filter((item) => item.petId === where.petId && item.deletedAt === null).sort((a, b) => b.measuredAt.getTime() - a.measuredAt.getTime()),
      findFirst: async ({ where, orderBy }: any) => {
        const filtered = weights.filter((item) => {
          if (where.id && item.id !== where.id) return false;
          if (item.petId !== where.petId) return false;
          if (where.deletedAt === null && item.deletedAt !== null) return false;
          return true;
        });
        if (orderBy) {
          filtered.sort((a, b) => b.measuredAt.getTime() - a.measuredAt.getTime() || b.createdAt.getTime() - a.createdAt.getTime());
        }
        return filtered[0] ?? null;
      },
      create: async ({ data }: any) => {
        sequence += 1;
        const row = {
          id: `weight-${sequence}`,
          petId: data.petId,
          weightKg: data.weightKg,
          measuredAt: data.measuredAt,
          note: data.note,
          createdAt: now(),
          updatedAt: now(),
          deletedAt: null,
        };
        weights.push(row);
        return row;
      },
      update: async ({ where, data }: any) => {
        const row = weights.find((item) => item.id === where.id)!;
        applyDefined(row, data);
        row.updatedAt = now();
        return row;
      },
    },
    petVaccination: {
      findMany: async ({ where }: any) => vaccinations.filter((item) => item.petId === where.petId && item.deletedAt === null),
      findFirst: async ({ where }: any) => vaccinations.find((item) => item.id === where.id && item.petId === where.petId && item.deletedAt === null) ?? null,
      create: async ({ data }: any) => {
        const row = { id: `vacc-${vaccinations.length + 1}`, ...data, createdAt: now(), updatedAt: now(), deletedAt: null };
        vaccinations.push(row);
        return row;
      },
      update: async ({ where, data }: any) => {
        const row = vaccinations.find((item) => item.id === where.id)!;
        applyDefined(row, data);
        row.updatedAt = now();
        return row;
      },
    },
    petDeworming: {
      findMany: async ({ where }: any) => dewormings.filter((item) => item.petId === where.petId && item.deletedAt === null),
      findFirst: async ({ where }: any) => dewormings.find((item) => item.id === where.id && item.petId === where.petId && item.deletedAt === null) ?? null,
      create: async ({ data }: any) => {
        const row = { id: `deworm-${dewormings.length + 1}`, ...data, createdAt: now(), updatedAt: now(), deletedAt: null };
        dewormings.push(row);
        return row;
      },
      update: async ({ where, data }: any) => {
        const row = dewormings.find((item) => item.id === where.id)!;
        applyDefined(row, data);
        row.updatedAt = now();
        return row;
      },
    },
    petVetVisit: {
      findMany: async ({ where }: any) => vetVisits.filter((item) => item.petId === where.petId && item.deletedAt === null),
      findFirst: async ({ where }: any) => vetVisits.find((item) => item.id === where.id && item.petId === where.petId && item.deletedAt === null) ?? null,
      create: async ({ data }: any) => {
        const row = { id: `visit-${vetVisits.length + 1}`, ...data, createdAt: now(), updatedAt: now(), deletedAt: null };
        vetVisits.push(row);
        return row;
      },
      update: async ({ where, data }: any) => {
        const row = vetVisits.find((item) => item.id === where.id)!;
        applyDefined(row, data);
        row.updatedAt = now();
        return row;
      },
    },
    $transaction: async (cb: any) => cb(prisma),
  } as any;

  const petsService = {
    ensureOwnership: async (userId: string, petId: string) => {
      const pet = pets.find((item) => item.id === petId);
      if (!pet || pet.userId !== userId) throw new ForbiddenException('You cannot access this pet');
      return pet;
    },
  } as any;

  return {
    service: new PetRecordsService(prisma, petsService),
    state: { pets, weights, vaccinations, dewormings, vetVisits },
  };
}

test('ownership is enforced before listing profile', async () => {
  const { service } = createPetRecordsService();
  await assert.rejects(() => service.getProfile('user-2', 'pet-1'));
});

test('weight CRUD recalculates pet current weight from latest measuredAt and nulls when empty', async () => {
  const { service, state } = createPetRecordsService();

  const w1 = await service.createWeight('user-1', 'pet-1', {
    weightKg: '10.50',
    measuredAt: '2026-03-20T10:00:00.000Z',
  });
  assert.equal(state.pets[0].weightKg.toString(), '10.5');

  const w2 = await service.createWeight('user-1', 'pet-1', {
    weightKg: '11.20',
    measuredAt: '2026-03-25T10:00:00.000Z',
  });
  assert.equal(state.pets[0].weightKg.toString(), '11.2');

  await service.updateWeight('user-1', 'pet-1', w1.id, {
    measuredAt: '2026-03-30T10:00:00.000Z',
    weightKg: '12.40',
  });
  assert.equal(state.pets[0].weightKg.toString(), '12.4');

  await service.deleteWeight('user-1', 'pet-1', w1.id);
  assert.equal(state.pets[0].weightKg.toString(), '11.2');

  await service.deleteWeight('user-1', 'pet-1', w2.id);
  assert.equal(state.pets[0].weightKg, null);
});

test('vaccinations/dewormings/vet visits support CRUD and profile aggregation', async () => {
  const { service } = createPetRecordsService();

  const vaccination = await service.createVaccination('user-1', 'pet-1', {
    vaccineName: 'Rabia',
    applicationDate: '2026-03-01',
    nextDueDate: '2027-03-01',
  });
  assert.equal(vaccination.vaccineName, 'Rabia');

  await service.updateVaccination('user-1', 'pet-1', vaccination.id, {
    clinicName: 'Vet Centro',
  });

  const deworming = await service.createDeworming('user-1', 'pet-1', {
    productName: 'Drontal',
    applicationDate: '2026-03-05',
  });
  assert.equal(deworming.productName, 'Drontal');

  await service.updateDeworming('user-1', 'pet-1', deworming.id, {
    dose: '1 tableta',
  });

  const visit = await service.createVetVisit('user-1', 'pet-1', {
    visitDate: '2026-03-10',
    reason: 'Control',
  });
  assert.equal(visit.reason, 'Control');

  await service.updateVetVisit('user-1', 'pet-1', visit.id, {
    diagnosis: 'Sano',
  });

  const profile = await service.getProfile('user-1', 'pet-1');
  assert.equal(profile.petId, 'pet-1');
  assert.equal(profile.vaccinations.length, 1);
  assert.equal(profile.dewormings.length, 1);
  assert.equal(profile.vetVisits.length, 1);

  await service.deleteVaccination('user-1', 'pet-1', vaccination.id);
  await service.deleteDeworming('user-1', 'pet-1', deworming.id);
  await service.deleteVetVisit('user-1', 'pet-1', visit.id);

  assert.equal((await service.listVaccinations('user-1', 'pet-1')).length, 0);
  assert.equal((await service.listDewormings('user-1', 'pet-1')).length, 0);
  assert.equal((await service.listVetVisits('user-1', 'pet-1')).length, 0);
});
