import test from 'node:test';
import assert from 'node:assert/strict';
import { SyncService } from '../src/modules/sync/sync.service';

function createSyncService() {
  let createManyCalls = 0;
  const prisma = {
    petDevice: {
      findFirst: async () => ({ id: 'pd-1' }),
    },
    $transaction: async (callback: any) => callback({
      activityEvent: {
        createMany: async () => {
          createManyCalls += 1;
          return { count: createManyCalls === 1 ? 1 : 0 };
        },
        findMany: async () => [{ activityType: 'walk', durationSeconds: 600, startedAt: new Date('2026-01-01T10:00:00Z') }],
      },
      activityDailySummary: {
        upsert: async () => ({}),
      },
      device: {
        update: async () => ({}),
      },
      syncLog: {
        create: async ({ data }: any) => ({ id: 'sync-1', syncedAt: new Date(), ...data }),
      },
    }),
  } as any;

  const petsService = { ensureOwnership: async () => ({ id: 'pet-1' }) } as any;
  const devicesService = { getById: async () => ({ id: 'device-1' }) } as any;
  const service = new SyncService(prisma, petsService, devicesService);
  return service;
}

test('sync accepts valid payload and reports skipped duplicates on repeated lot', async () => {
  const service = createSyncService();
  const payload = {
    petId: 'pet-1',
    deviceId: 'device-1',
    generatedAt: '2026-01-01T12:00:00Z',
    timezone: 'UTC',
    batteryLevel: 80,
    events: [
      {
        activityType: 'walk',
        startedAt: '2026-01-01T10:00:00Z',
        endedAt: '2026-01-01T10:10:00Z',
        durationSeconds: 600,
      },
    ],
  };

  const first = await service.syncActivity('user-1', payload as any);
  assert.equal(first.storedEvents, 1);

  const second = await service.syncActivity('user-1', payload as any);
  assert.equal(second.skippedDuplicates, 1);
});

test('sync rejects invalid duration', async () => {
  const service = createSyncService();
  await assert.rejects(() =>
    service.syncActivity('user-1', {
      petId: 'pet-1',
      deviceId: 'device-1',
      generatedAt: '2026-01-01T12:00:00Z',
      timezone: 'UTC',
      events: [
        {
          activityType: 'walk',
          startedAt: '2026-01-01T10:00:00Z',
          endedAt: '2026-01-01T10:30:00Z',
          durationSeconds: 60,
        },
      ],
    } as any),
  );
});
