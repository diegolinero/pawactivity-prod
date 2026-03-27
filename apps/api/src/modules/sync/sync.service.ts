import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ActivityType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { PetsService } from '../pets/pets.service';
import { DevicesService } from '../devices/devices.service';
import { SyncActivityDto } from './dto/sync-activity.dto';
import { SyncActivitySummaryDto } from './dto/sync-activity-summary.dto';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly petsService: PetsService,
    private readonly devicesService: DevicesService,
    private readonly metricsService: MetricsService,
  ) {}

  async syncActivity(userId: string, dto: SyncActivityDto) {
    this.logger.log(JSON.stringify({
      event: 'activity_sync_received',
      userId,
      petId: dto.petId,
      deviceId: dto.deviceId,
      recordsReceived: dto.events.length,
      generatedAt: dto.generatedAt,
      timezone: dto.timezone,
    }));
    this.metricsService.increment('activity_sync_received_total');

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
      this.metricsService.increment('activity_sync_error_total');
      this.logger.warn(JSON.stringify({ event: 'activity_sync_rejected', userId, petId: dto.petId, deviceId: dto.deviceId, reason: 'device_not_assigned' }));
      throw new ForbiddenException('Device is not actively assigned to this pet');
    }

    const generatedAt = new Date(dto.generatedAt);
    if (Number.isNaN(generatedAt.getTime())) {
      this.metricsService.increment('activity_sync_error_total');
      this.logger.warn(JSON.stringify({ event: 'activity_sync_rejected', userId, petId: dto.petId, deviceId: dto.deviceId, reason: 'invalid_generated_at' }));
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

    const response = {
      success: true,
      syncLogId: result.log.id,
      recordsReceived: events.length,
      storedEvents: result.storedEvents,
      skippedDuplicates: events.length - result.storedEvents,
      syncedAt: result.log.syncedAt.toISOString(),
      updatedDates: affectedDates,
    };

    this.logger.log(JSON.stringify({
      event: 'activity_sync_success',
      userId,
      petId: dto.petId,
      deviceId: dto.deviceId,
      syncLogId: response.syncLogId,
      recordsReceived: response.recordsReceived,
      storedEvents: response.storedEvents,
      skippedDuplicates: response.skippedDuplicates,
      updatedDates: response.updatedDates,
    }));
    this.metricsService.increment('activity_sync_success_total');
    this.metricsService.trackSync(userId, response.recordsReceived, response.skippedDuplicates);

    if (response.skippedDuplicates > 0) {
      this.logger.warn(JSON.stringify({
        event: 'activity_sync_duplicates_detected',
        userId,
        petId: dto.petId,
        deviceId: dto.deviceId,
        skippedDuplicates: response.skippedDuplicates,
      }));
    }

    return response;
  }


  async syncActivitySummary(userId: string, dto: SyncActivitySummaryDto) {
    this.logger.log(JSON.stringify({
      event: 'activity_summary_sync_received',
      userId,
      petId: dto.petId,
      deviceId: dto.deviceId,
      generatedAt: dto.generatedAt,
      summaryDate: dto.summaryDate,
      timezone: dto.timezone,
      restSeconds: dto.restSeconds,
      walkSeconds: dto.walkSeconds,
      runSeconds: dto.runSeconds,
      totalActiveSeconds: dto.totalActiveSeconds,
    }));
    this.metricsService.increment('activity_summary_sync_received_total');

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
      this.metricsService.increment('activity_summary_sync_error_total');
      this.logger.warn(JSON.stringify({
        event: 'activity_summary_sync_rejected',
        userId,
        petId: dto.petId,
        deviceId: dto.deviceId,
        summaryDate: dto.summaryDate,
        timezone: dto.timezone,
        reason: 'device_not_assigned',
      }));
      throw new ForbiddenException('Device is not actively assigned to this pet');
    }

    const generatedAt = new Date(dto.generatedAt);
    if (Number.isNaN(generatedAt.getTime())) {
      this.metricsService.increment('activity_summary_sync_error_total');
      this.logger.warn(JSON.stringify({
        event: 'activity_summary_sync_rejected',
        userId,
        petId: dto.petId,
        deviceId: dto.deviceId,
        summaryDate: dto.summaryDate,
        timezone: dto.timezone,
        reason: 'invalid_generated_at',
      }));
      throw new BadRequestException('Invalid generatedAt');
    }

    this.assertValidTimezone(dto.timezone);

    const summaryDate = new Date(`${dto.summaryDate}T00:00:00.000Z`);
    if (Number.isNaN(summaryDate.getTime()) || summaryDate.toISOString().slice(0, 10) !== dto.summaryDate) {
      this.metricsService.increment('activity_summary_sync_error_total');
      this.logger.warn(JSON.stringify({
        event: 'activity_summary_sync_rejected',
        userId,
        petId: dto.petId,
        deviceId: dto.deviceId,
        summaryDate: dto.summaryDate,
        timezone: dto.timezone,
        reason: 'invalid_summary_date',
      }));
      throw new BadRequestException('Invalid summaryDate');
    }

    const computedTotalActiveSeconds = dto.walkSeconds + dto.runSeconds;
    if (dto.totalActiveSeconds !== computedTotalActiveSeconds) {
      this.logger.warn(JSON.stringify({
        event: 'activity_summary_sync_total_active_mismatch',
        userId,
        petId: dto.petId,
        deviceId: dto.deviceId,
        summaryDate: dto.summaryDate,
        timezone: dto.timezone,
        providedTotalActiveSeconds: dto.totalActiveSeconds,
        computedTotalActiveSeconds,
      }));
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.activityDailySummary.upsert({
        where: {
          petId_summaryDate: {
            petId: dto.petId,
            summaryDate,
          },
        },
        update: {
          timezone: dto.timezone,
          restSeconds: dto.restSeconds,
          walkSeconds: dto.walkSeconds,
          runSeconds: dto.runSeconds,
          totalActiveSeconds: computedTotalActiveSeconds,
        },
        create: {
          petId: dto.petId,
          summaryDate,
          timezone: dto.timezone,
          restSeconds: dto.restSeconds,
          walkSeconds: dto.walkSeconds,
          runSeconds: dto.runSeconds,
          totalActiveSeconds: computedTotalActiveSeconds,
        },
      });

      await tx.device.update({
        where: { id: dto.deviceId },
        data: {
          batteryLevel: dto.batteryLevel,
          lastSeenAt: generatedAt,
          status: 'assigned',
        },
      });

      return tx.syncLog.create({
        data: {
          userId,
          petId: dto.petId,
          deviceId: dto.deviceId,
          generatedAt,
          timezone: dto.timezone,
          recordsReceived: 1,
          status: 'success',
          syncedAt: new Date(),
          errorMessage: dto.totalActiveSeconds === computedTotalActiveSeconds
            ? null
            : 'totalActiveSeconds mismatch; backend value recalculated from walk+run',
        },
      });
    });

    const response = {
      success: true,
      syncLogId: result.id,
      summaryDate: dto.summaryDate,
      timezone: dto.timezone,
      totals: {
        restSeconds: dto.restSeconds,
        walkSeconds: dto.walkSeconds,
        runSeconds: dto.runSeconds,
        totalActiveSeconds: computedTotalActiveSeconds,
      },
      syncedAt: result.syncedAt.toISOString(),
    };

    this.logger.log(JSON.stringify({
      event: 'activity_summary_sync_success',
      userId,
      petId: dto.petId,
      deviceId: dto.deviceId,
      syncLogId: response.syncLogId,
      summaryDate: response.summaryDate,
      timezone: response.timezone,
      totals: response.totals,
    }));
    this.metricsService.increment('activity_summary_sync_success_total');

    return response;
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
