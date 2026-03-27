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
    };

    this.logger.log(JSON.stringify({
      event: 'daily_summary_upsert_skipped_for_event_sync',
      userId,
      petId: dto.petId,
      deviceId: dto.deviceId,
      recordsReceived: events.length,
      storedEvents: response.storedEvents,
      reason: 'activity_daily_summary_governed_by_snapshot_sync',
    }));

    this.logger.log(JSON.stringify({
      event: 'activity_sync_success',
      userId,
      petId: dto.petId,
      deviceId: dto.deviceId,
      syncLogId: response.syncLogId,
      recordsReceived: response.recordsReceived,
      storedEvents: response.storedEvents,
      skippedDuplicates: response.skippedDuplicates,
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

      this.logger.log(JSON.stringify({
        event: 'daily_summary_upsert_from_snapshot',
        userId,
        petId: dto.petId,
        deviceId: dto.deviceId,
        summaryDate: dto.summaryDate,
        timezone: dto.timezone,
      }));

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

  private assertValidTimezone(timezone: string) {
    try {
      new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date());
    } catch {
      throw new BadRequestException('Invalid timezone');
    }
  }

}
