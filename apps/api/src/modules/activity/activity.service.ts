import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PetsService } from '../pets/pets.service';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly petsService: PetsService,
  ) {}

  async getDaily(userId: string, petId: string, date?: string, timezone?: string) {
    await this.petsService.ensureOwnership(userId, petId);
    const resolvedTimezone = await this.resolveTimezone(petId, timezone);
    const targetDateKey = date ? this.normalizeDateKey(date) : this.getCurrentDateKey(resolvedTimezone);
    const targetDate = this.toSummaryDate(targetDateKey);

    this.logger.log(
      `daily query petId=${petId} timezone=${resolvedTimezone} dateKey=${targetDateKey} summaryDate=${targetDateKey}`,
    );

    const summary = await this.prisma.activityDailySummary.findUnique({
      where: {
        petId_summaryDate: {
          petId,
          summaryDate: targetDate,
        },
      },
    });

    return this.serializeSummary(summary, targetDateKey, resolvedTimezone);
  }

  async getWeekly(userId: string, petId: string, startDate?: string, timezone?: string) {
    await this.petsService.ensureOwnership(userId, petId);
    const resolvedTimezone = await this.resolveTimezone(petId, timezone);
    const endDateKey = this.getCurrentDateKey(resolvedTimezone);
    const startDateKey = startDate ? this.normalizeDateKey(startDate) : this.shiftDateKey(endDateKey, -6);
    const queryStartDate = this.toSummaryDate(startDateKey);
    const queryEndDate = this.toSummaryDate(this.shiftDateKey(startDateKey, 6));

    this.logger.log(
      `weekly query petId=${petId} timezone=${resolvedTimezone} startDate=${startDateKey} endDate=${this.toDateKey(queryEndDate)}`,
    );

    const summaries = await this.prisma.activityDailySummary.findMany({
      where: {
        petId,
        summaryDate: {
          gte: queryStartDate,
          lte: queryEndDate,
        },
      },
      orderBy: { summaryDate: 'asc' },
    });

    const summariesByDate = new Map(summaries.map((summary) => [this.toDateKey(summary.summaryDate), summary]));
    const days = this.fillDateRange(startDateKey, 7).map((dateKey) => {
      const current = summariesByDate.get(dateKey);
      return this.serializeSummary(current, dateKey, resolvedTimezone);
    });

    return {
      startDate: startDateKey,
      endDate: this.toDateKey(queryEndDate),
      days,
    };
  }

  async getMonthly(userId: string, petId: string, month?: string, timezone?: string) {
    await this.petsService.ensureOwnership(userId, petId);
    const resolvedTimezone = await this.resolveTimezone(petId, timezone);
    const targetMonth = this.normalizeMonth(month, resolvedTimezone);
    const startDateKey = `${targetMonth}-01`;
    const [year, monthNumber] = targetMonth.split('-').map(Number);
    if (!year || !monthNumber) {
      throw new BadRequestException('Invalid month');
    }

    const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    const endDateKey = `${targetMonth}-${String(lastDay).padStart(2, '0')}`;

    this.logger.log(`monthly query petId=${petId} timezone=${resolvedTimezone} month=${targetMonth}`);

    const summaries = await this.prisma.activityDailySummary.findMany({
      where: {
        petId,
        summaryDate: {
          gte: this.toSummaryDate(startDateKey),
          lte: this.toSummaryDate(endDateKey),
        },
      },
      orderBy: { summaryDate: 'asc' },
    });

    return {
      month: targetMonth,
      days: summaries.map((summary) => this.serializeSummary(summary, this.toDateKey(summary.summaryDate), resolvedTimezone)),
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

  async getHistory(userId: string, petId: string, range: 'today' | 'week' | 'month' = 'week', timezone?: string) {
    await this.petsService.ensureOwnership(userId, petId);
    this.assertValidRange(range);

    const resolvedTimezone = await this.resolveTimezone(petId, timezone);
    const todayDateKey = this.getCurrentDateKey(resolvedTimezone);
    let startDateKey = todayDateKey;

    if (range === 'week') {
      startDateKey = this.shiftDateKey(todayDateKey, -6);
    } else if (range === 'month') {
      startDateKey = `${todayDateKey.slice(0, 7)}-01`;
    }

    this.logger.log(`history query petId=${petId} timezone=${resolvedTimezone} range=${range} startDate=${startDateKey}`);

    const summaries = await this.prisma.activityDailySummary.findMany({
      where: {
        petId,
        summaryDate: { gte: this.toSummaryDate(startDateKey) },
      },
      orderBy: { summaryDate: 'desc' },
    });

    return summaries.map((summary) => this.serializeSummary(summary, this.toDateKey(summary.summaryDate), resolvedTimezone));
  }

  async getTimeline(userId: string, petId: string, date?: string, timezone?: string) {
    await this.petsService.ensureOwnership(userId, petId);
    const resolvedTimezone = await this.resolveTimezone(petId, timezone);
    const targetDate = date ? this.normalizeDateKey(date) : this.getCurrentDateKey(resolvedTimezone);
    const utcStart = new Date(`${targetDate}T00:00:00.000Z`);
    const utcEnd = new Date(`${targetDate}T23:59:59.999Z`);
    utcStart.setUTCDate(utcStart.getUTCDate() - 1);
    utcEnd.setUTCDate(utcEnd.getUTCDate() + 1);

    this.logger.log(`timeline query petId=${petId} timezone=${resolvedTimezone} dateKey=${targetDate}`);

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
      .filter((event) => this.toTimezoneDateKey(event.startedAt, resolvedTimezone) === targetDate)
      .map((event) => ({
        id: event.id,
        activityType: event.activityType,
        startedAt: event.startedAt.toISOString(),
        endedAt: event.endedAt.toISOString(),
        durationSeconds: event.durationSeconds,
        confidence: event.confidence ? Number(event.confidence) : null,
      }));
  }

  private serializeSummary(summary: any, dateKey: string, fallbackTimezone: string) {
    return {
      date: dateKey,
      timezone: summary?.timezone ?? fallbackTimezone,
      restSeconds: summary?.restSeconds ?? 0,
      walkSeconds: summary?.walkSeconds ?? 0,
      runSeconds: summary?.runSeconds ?? 0,
      totalActiveSeconds: summary?.totalActiveSeconds ?? 0,
      hasData: Boolean(summary),
    };
  }

  private normalizeDateKey(input: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      throw new BadRequestException('Invalid date');
    }

    const normalized = new Date(`${input}T00:00:00.000Z`);
    if (Number.isNaN(normalized.getTime())) {
      throw new BadRequestException('Invalid date');
    }

    return input;
  }

  private normalizeMonth(month: string | undefined, timezone: string) {
    if (!month) {
      return this.getCurrentDateKey(timezone).slice(0, 7);
    }

    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new BadRequestException('Invalid month');
    }

    return month;
  }

  private fillDateRange(startDateKey: string, days: number) {
    return Array.from({ length: days }, (_, index) => this.shiftDateKey(startDateKey, index));
  }

  private shiftDateKey(dateKey: string, diffDays: number) {
    const date = this.toSummaryDate(dateKey);
    date.setUTCDate(date.getUTCDate() + diffDays);
    return this.toDateKey(date);
  }

  private toSummaryDate(dateKey: string) {
    return new Date(`${dateKey}T00:00:00.000Z`);
  }

  private toDateKey(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private getCurrentDateKey(timezone: string) {
    return this.toTimezoneDateKey(new Date(), timezone);
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
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;

    if (!year || !month || !day) {
      throw new BadRequestException('Could not resolve date for timezone');
    }

    return `${year}-${month}-${day}`;
  }

  private async resolveTimezone(petId: string, requestedTimezone?: string) {
    if (requestedTimezone) {
      this.assertValidTimezone(requestedTimezone);
      return requestedTimezone;
    }

    const latestSummary = await this.prisma.activityDailySummary.findFirst({
      where: { petId },
      orderBy: { summaryDate: 'desc' },
      select: { timezone: true },
    });

    if (latestSummary?.timezone) {
      this.assertValidTimezone(latestSummary.timezone);
      return latestSummary.timezone;
    }

    return 'UTC';
  }
}
