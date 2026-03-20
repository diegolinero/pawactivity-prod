import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PetsService } from '../pets/pets.service';

@Injectable()
export class ActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly petsService: PetsService,
  ) {}

  async getDaily(userId: string, petId: string, date?: string) {
    await this.petsService.ensureOwnership(userId, petId);
    const targetDate = this.normalizeDate(date);
    const summary = await this.prisma.activityDailySummary.findUnique({
      where: {
        petId_summaryDate: {
          petId,
          summaryDate: targetDate,
        },
      },
    });

    return this.serializeSummary(summary, targetDate);
  }

  async getWeekly(userId: string, petId: string, startDate?: string) {
    await this.petsService.ensureOwnership(userId, petId);
    const start = this.normalizeDate(startDate ?? this.shiftDate(new Date(), -6));
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);

    const summaries = await this.prisma.activityDailySummary.findMany({
      where: {
        petId,
        summaryDate: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { summaryDate: 'asc' },
    });

    const days = this.fillDateRange(start, 7).map((dateValue) => {
      const current = summaries.find((summary) => this.toDateKey(summary.summaryDate) === this.toDateKey(dateValue));
      return this.serializeSummary(current, dateValue);
    });

    return {
      startDate: this.toDateKey(start),
      endDate: this.toDateKey(end),
      days,
    };
  }

  async getMonthly(userId: string, petId: string, month?: string) {
    await this.petsService.ensureOwnership(userId, petId);
    const start = this.normalizeMonth(month);
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));

    const summaries = await this.prisma.activityDailySummary.findMany({
      where: {
        petId,
        summaryDate: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { summaryDate: 'asc' },
    });

    return {
      month: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`,
      days: summaries.map((summary) => this.serializeSummary(summary, summary.summaryDate)),
      totals: summaries.reduce(
        (acc, summary) => {
          acc.restSeconds += summary.restSeconds;
          acc.walkSeconds += summary.walkSeconds;
          acc.runSeconds += summary.runSeconds;
          acc.totalActiveSeconds += summary.totalActiveSeconds;
          return acc;
        },
        { restSeconds: 0, walkSeconds: 0, runSeconds: 0, totalActiveSeconds: 0 },
      ),
    };
  }

  async getHistory(userId: string, petId: string, range: 'today' | 'week' | 'month' = 'week') {
    await this.petsService.ensureOwnership(userId, petId);
    this.assertValidRange(range);

    let start = new Date();
    if (range === 'today') {
      start = this.normalizeDate(new Date());
    } else if (range === 'week') {
      start = this.normalizeDate(this.shiftDate(new Date(), -6));
    } else {
      start = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
    }

    const summaries = await this.prisma.activityDailySummary.findMany({
      where: {
        petId,
        summaryDate: { gte: start },
      },
      orderBy: { summaryDate: 'desc' },
    });

    return summaries.map((summary) => this.serializeSummary(summary, summary.summaryDate));
  }

  async getTimeline(userId: string, petId: string, date?: string, timezone = 'UTC') {
    await this.petsService.ensureOwnership(userId, petId);
    this.assertValidTimezone(timezone);
    const targetDate = this.toDateKey(this.normalizeDate(date));
    const utcStart = new Date(`${targetDate}T00:00:00.000Z`);
    const utcEnd = new Date(`${targetDate}T23:59:59.999Z`);
    utcStart.setUTCDate(utcStart.getUTCDate() - 1);
    utcEnd.setUTCDate(utcEnd.getUTCDate() + 1);

    const events = await this.prisma.activityEvent.findMany({
      where: {
        petId,
        startedAt: {
          gte: utcStart,
          lte: utcEnd,
        },
      },
      orderBy: { startedAt: 'asc' },
    });

    return events
      .filter((event) => this.toTimezoneDateKey(event.startedAt, timezone) === targetDate)
      .map((event) => ({
        id: event.id,
        activityType: event.activityType,
        startedAt: event.startedAt.toISOString(),
        endedAt: event.endedAt.toISOString(),
        durationSeconds: event.durationSeconds,
        confidence: event.confidence ? Number(event.confidence) : null,
      }));
  }

  private serializeSummary(summary: any, date: Date) {
    return {
      date: this.toDateKey(date),
      timezone: summary?.timezone ?? 'UTC',
      restSeconds: summary?.restSeconds ?? 0,
      walkSeconds: summary?.walkSeconds ?? 0,
      runSeconds: summary?.runSeconds ?? 0,
      totalActiveSeconds: summary?.totalActiveSeconds ?? 0,
      hasData: Boolean(summary),
    };
  }

  private normalizeDate(input?: string | Date) {
    const date = input instanceof Date ? input : input ? new Date(`${input}T00:00:00.000Z`) : new Date();
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date');
    }
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  private normalizeMonth(month?: string) {
    if (!month) {
      const now = new Date();
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    }

    const [year, monthNumber] = month.split('-').map(Number);
    if (!year || !monthNumber) {
      throw new BadRequestException('Invalid month');
    }

    return new Date(Date.UTC(year, monthNumber - 1, 1));
  }

  private shiftDate(date: Date, diffDays: number) {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + diffDays);
    return next;
  }

  private fillDateRange(start: Date, days: number) {
    return Array.from({ length: days }, (_, index) => {
      const current = new Date(start);
      current.setUTCDate(current.getUTCDate() + index);
      return current;
    });
  }

  private toDateKey(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private assertValidRange(range: string) {
    if (!['today', 'week', 'month'].includes(range)) {
      throw new BadRequestException('Invalid history range');
    }
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
