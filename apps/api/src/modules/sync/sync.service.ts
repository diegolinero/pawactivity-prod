import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ActivityType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PetsService } from '../pets/pets.service';
import { DevicesService } from '../devices/devices.service';
import { SyncActivityDto } from './dto/sync-activity.dto';

@Injectable()
export class SyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly petsService: PetsService,
    private readonly devicesService: DevicesService,
  ) {}

  async syncActivity(userId: string, dto: SyncActivityDto) {
    await this.petsService.ensureOwnership(userId, dto.petId);
    await this.devicesService.getById(userId, dto.deviceId);

    const activeAssignment = await this.prisma.petDevice.findFirst({
      where: {
        petId: dto.petId,
        deviceId: dto.deviceId,
        isActive: true,
      },
    });

    if (!activeAssignment) {
      throw new ForbiddenException('Device is not actively assigned to this pet');
    }

    const generatedAt = new Date(dto.generatedAt);
    if (Number.isNaN(generatedAt.getTime())) {
      throw new BadRequestException('Invalid generatedAt');
    }

    this.assertValidTimezone(dto.timezone);

    const events = dto.events.map((event) => this.normalizeEvent(event));
    this.validateEvents(events);

    const affectedDates = [...new Set(events.map((event) => this.toTimezoneDateKey(event.startedAt, dto.timezone)))];

    const result = await this.prisma.$transaction(async (tx) => {
      const createResult = await tx.activityEvent.createMany({
        data: events.map((event) => ({
          petId: dto.petId,
          deviceId: dto.deviceId,
          activityType: event.activityType,
          startedAt: event.startedAt,
          endedAt: event.endedAt,
          durationSeconds: event.durationSeconds,
          confidence: event.confidence != null ? new Prisma.Decimal(event.confidence.toFixed(3)) : null,
          recordedAt: generatedAt,
        })),
        skipDuplicates: true,
      });

      for (const dateKey of affectedDates) {
        const totals = await this.recalculateSummaryForDate(tx, dto.petId, dto.timezone, dateKey);

        await tx.activityDailySummary.upsert({
          where: {
            petId_summaryDate: {
              petId: dto.petId,
              summaryDate: new Date(`${dateKey}T00:00:00.000Z`),
            },
          },
          update: {
            timezone: dto.timezone,
            restSeconds: totals.restSeconds,
            walkSeconds: totals.walkSeconds,
            runSeconds: totals.runSeconds,
            totalActiveSeconds: totals.totalActiveSeconds,
          },
          create: {
            petId: dto.petId,
            summaryDate: new Date(`${dateKey}T00:00:00.000Z`),
            timezone: dto.timezone,
            restSeconds: totals.restSeconds,
            walkSeconds: totals.walkSeconds,
            runSeconds: totals.runSeconds,
            totalActiveSeconds: totals.totalActiveSeconds,
          },
        });
      }

      await tx.device.update({
        where: { id: dto.deviceId },
        data: {
          batteryLevel: dto.batteryLevel,
          lastSeenAt: generatedAt,
          status: 'assigned',
        },
      });

      const log = await tx.syncLog.create({
        data: {
          userId,
          petId: dto.petId,
          deviceId: dto.deviceId,
          generatedAt,
          timezone: dto.timezone,
          recordsReceived: events.length,
          status: 'success',
          syncedAt: new Date(),
          errorMessage: createResult.count < events.length ? 'Some duplicate events were skipped' : null,
        },
      });

      return { log, storedEvents: createResult.count };
    });

    return {
      success: true,
      syncLogId: result.log.id,
      recordsReceived: events.length,
      storedEvents: result.storedEvents,
      skippedDuplicates: events.length - result.storedEvents,
      syncedAt: result.log.syncedAt.toISOString(),
      updatedDates: affectedDates,
    };
  }

  private normalizeEvent(event: SyncActivityDto['events'][number]) {
    return {
      activityType: event.activityType as ActivityType,
      startedAt: new Date(event.startedAt),
      endedAt: new Date(event.endedAt),
      durationSeconds: event.durationSeconds,
      confidence: event.confidence,
    };
  }

  private validateEvents(
    events: Array<{
      activityType: ActivityType;
      startedAt: Date;
      endedAt: Date;
      durationSeconds: number;
      confidence?: number;
    }>,
  ) {
    for (const event of events) {
      if (Number.isNaN(event.startedAt.getTime()) || Number.isNaN(event.endedAt.getTime())) {
        throw new BadRequestException('Invalid event dates');
      }

      if (event.endedAt <= event.startedAt) {
        throw new BadRequestException('Event end must be after start');
      }

      const actualDurationSeconds = Math.round((event.endedAt.getTime() - event.startedAt.getTime()) / 1000);
      if (Math.abs(actualDurationSeconds - event.durationSeconds) > 5) {
        throw new BadRequestException('Event duration does not match timestamps');
      }

      if (event.confidence != null && (event.confidence < 0 || event.confidence > 1)) {
        throw new BadRequestException('Event confidence must be between 0 and 1');
      }
    }
  }

  private async recalculateSummaryForDate(tx: any, petId: string, timezone: string, dateKey: string) {
    const utcStart = new Date(`${dateKey}T00:00:00.000Z`);
    const utcEnd = new Date(`${dateKey}T23:59:59.999Z`);
    utcStart.setUTCDate(utcStart.getUTCDate() - 1);
    utcEnd.setUTCDate(utcEnd.getUTCDate() + 1);

    const events = await tx.activityEvent.findMany({
      where: {
        petId,
        startedAt: {
          gte: utcStart,
          lte: utcEnd,
        },
      },
    });

    return events
      .filter((event: { startedAt: Date }) => this.toTimezoneDateKey(event.startedAt, timezone) === dateKey)
      .reduce(
        (acc: { restSeconds: number; walkSeconds: number; runSeconds: number; totalActiveSeconds: number }, event: { activityType: ActivityType; durationSeconds: number }) => {
          if (event.activityType === 'rest') acc.restSeconds += event.durationSeconds;
          if (event.activityType === 'walk') {
            acc.walkSeconds += event.durationSeconds;
            acc.totalActiveSeconds += event.durationSeconds;
          }
          if (event.activityType === 'run') {
            acc.runSeconds += event.durationSeconds;
            acc.totalActiveSeconds += event.durationSeconds;
          }
          return acc;
        },
        { restSeconds: 0, walkSeconds: 0, runSeconds: 0, totalActiveSeconds: 0 },
      );
  }

  private assertValidTimezone(timezone: string) {
    try {
      new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date());
    } catch {
      throw new BadRequestException('Invalid timezone');
    }
  }

  private toTimezoneDateKey(date: Date, timezone: string) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }
}
