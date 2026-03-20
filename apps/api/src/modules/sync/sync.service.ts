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
    const events = dto.events.map((event) => this.normalizeEvent(event));
    this.validateEvents(events);

    const summaryByDate = this.buildDailySummaryMap(events, dto.timezone);

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.activityEvent.createMany({
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
      });

      for (const [summaryDate, values] of summaryByDate.entries()) {
        await tx.activityDailySummary.upsert({
          where: {
            petId_summaryDate: {
              petId: dto.petId,
              summaryDate: new Date(`${summaryDate}T00:00:00.000Z`),
            },
          },
          update: {
            timezone: dto.timezone,
            restSeconds: { increment: values.restSeconds },
            walkSeconds: { increment: values.walkSeconds },
            runSeconds: { increment: values.runSeconds },
            totalActiveSeconds: { increment: values.totalActiveSeconds },
          },
          create: {
            petId: dto.petId,
            summaryDate: new Date(`${summaryDate}T00:00:00.000Z`),
            timezone: dto.timezone,
            restSeconds: values.restSeconds,
            walkSeconds: values.walkSeconds,
            runSeconds: values.runSeconds,
            totalActiveSeconds: values.totalActiveSeconds,
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
        },
      });

      return log;
    });

    return {
      success: true,
      syncLogId: result.id,
      recordsReceived: events.length,
      syncedAt: result.syncedAt.toISOString(),
      updatedDates: [...summaryByDate.keys()],
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
    }
  }

  private buildDailySummaryMap(
    events: Array<{
      activityType: ActivityType;
      startedAt: Date;
      endedAt: Date;
      durationSeconds: number;
    }>,
    timezone: string,
  ) {
    const summary = new Map<string, { restSeconds: number; walkSeconds: number; runSeconds: number; totalActiveSeconds: number }>();

    for (const event of events) {
      const day = this.toTimezoneDateKey(event.startedAt, timezone);
      const current = summary.get(day) ?? { restSeconds: 0, walkSeconds: 0, runSeconds: 0, totalActiveSeconds: 0 };

      if (event.activityType === 'rest') current.restSeconds += event.durationSeconds;
      if (event.activityType === 'walk') current.walkSeconds += event.durationSeconds;
      if (event.activityType === 'run') current.runSeconds += event.durationSeconds;
      if (event.activityType === 'walk' || event.activityType === 'run') {
        current.totalActiveSeconds += event.durationSeconds;
      }

      summary.set(day, current);
    }

    return summary;
  }

  private toTimezoneDateKey(date: Date, timezone: string) {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
    } catch {
      throw new BadRequestException('Invalid timezone');
    }
  }
}
