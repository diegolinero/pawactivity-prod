import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PetsService } from '../pets/pets.service';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);
  private readonly DAY_IN_MS = 24 * 60 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly petsService: PetsService,
  ) {}

  async getDaily(userId: string, petId: string, date?: string, timezone?: string) {
    await this.petsService.ensureOwnership(userId, petId);
    const resolvedTimezone = await this.resolveTimezone(userId, petId, timezone);
    const targetDateKey = this.resolveTargetDateKey(date, resolvedTimezone);
    const targetDate = this.dateKeyToUtcMidnight(targetDateKey);

    this.logger.log(
      `method=getDaily petId=${petId} timezone=${resolvedTimezone} localDateKey=${targetDateKey} summary_date=${targetDateKey}`,
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
    const resolvedTimezone = await this.resolveTimezone(userId, petId, timezone);
    const todayDateKey = this.getTodayDateKey(resolvedTimezone);
    const startDateKey = startDate ? this.normalizeDateKey(startDate) : this.shiftDateKey(todayDateKey, -6);
    const [queryStartDateKey, queryEndDateKey] = this.getDateKeyRange(startDateKey, 7);
    const queryStartDate = this.dateKeyToUtcMidnight(queryStartDateKey);
    const queryEndDate = this.dateKeyToUtcMidnight(queryEndDateKey);

    this.logger.log(`method=getWeekly petId=${petId} timezone=${resolvedTimezone} localDateKey=${todayDateKey} summary_start_date=${startDateKey} summary_end_date=${queryEndDateKey}`);

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

    const summariesByDate = new Map(summaries.map((summary) => [this.toUtcDateKey(summary.summaryDate), summary]));
    const days = this.fillDateRange(startDateKey, 7).map((dateKey) => {
      const current = summariesByDate.get(dateKey);
      return this.serializeSummary(current, dateKey, resolvedTimezone);
    });

    return {
      startDate: queryStartDateKey,
      endDate: queryEndDateKey,
      days,
    };
  }

  async getMonthly(userId: string, petId: string, month?: string, timezone?: string) {
    await this.petsService.ensureOwnership(userId, petId);
    const resolvedTimezone = await this.resolveTimezone(userId, petId, timezone);
    const targetMonth = this.normalizeMonth(month, resolvedTimezone);
    const monthReferenceDateKey = `${targetMonth}-01`;
    const [startDateKey, endDateKey] = this.getMonthRangeDateKeys(monthReferenceDateKey);
    const localDateKey = this.getTodayDateKey(resolvedTimezone);

    this.logger.log(`method=getMonthly petId=${petId} timezone=${resolvedTimezone} localDateKey=${localDateKey} month=${targetMonth} summary_start_date=${startDateKey} summary_end_date=${endDateKey}`);

    const summaries = await this.prisma.activityDailySummary.findMany({
      where: {
        petId,
        summaryDate: {
          gte: this.dateKeyToUtcMidnight(startDateKey),
          lte: this.dateKeyToUtcMidnight(endDateKey),
        },
      },
      orderBy: { summaryDate: 'asc' },
    });

    return {
      month: targetMonth,
      days: summaries.map((summary) => this.serializeSummary(summary, this.toUtcDateKey(summary.summaryDate), resolvedTimezone)),
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

    const resolvedTimezone = await this.resolveTimezone(userId, petId, timezone);
    const todayDateKey = this.getTodayDateKey(resolvedTimezone);
    let startDateKey = todayDateKey;

    if (range === 'week') {
      startDateKey = this.shiftDateKey(todayDateKey, -6);
    } else if (range === 'month') {
      startDateKey = this.getMonthStartDateKey(todayDateKey);
    }

    this.logger.log(`method=getHistory petId=${petId} timezone=${resolvedTimezone} range=${range} localDateKey=${todayDateKey} summary_start_date=${startDateKey} summary_end_date=${todayDateKey}`);

    const summaries = await this.prisma.activityDailySummary.findMany({
      where: {
        petId,
        summaryDate: {
          gte: this.dateKeyToUtcMidnight(startDateKey),
          lte: this.dateKeyToUtcMidnight(todayDateKey),
        },
      },
      orderBy: { summaryDate: 'desc' },
    });

    return summaries.map((summary) => this.serializeSummary(summary, this.toUtcDateKey(summary.summaryDate), resolvedTimezone));
  }

  async getTimeline(userId: string, petId: string, date?: string, timezone?: string) {
    await this.petsService.ensureOwnership(userId, petId);
    const resolvedTimezone = await this.resolveTimezone(userId, petId, timezone);
    const targetDate = this.resolveTargetDateKey(date, resolvedTimezone);
    const utcStart = this.dateKeyToUtcMidnight(this.shiftDateKey(targetDate, -1));
    const utcEnd = new Date(this.dateKeyToUtcMidnight(this.shiftDateKey(targetDate, 2)).getTime() - 1);

    this.logger.log(`method=getTimeline petId=${petId} timezone=${resolvedTimezone} localDateKey=${targetDate} queryWindowStart=${utcStart.toISOString()} queryWindowEnd=${utcEnd.toISOString()}`);

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

    const normalized = this.dateKeyToUtcNoon(input);
    if (Number.isNaN(normalized.getTime())) {
      throw new BadRequestException('Invalid date');
    }
    if (this.toUtcDateKey(normalized) !== input) {
      throw new BadRequestException('Invalid date');
    }

    return input;
  }

  private normalizeMonth(month: string | undefined, timezone: string) {
    if (!month) {
      return this.getTodayDateKey(timezone).slice(0, 7);
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
    const date = this.dateKeyToUtcNoon(dateKey);
    const shifted = new Date(date.getTime() + diffDays * this.DAY_IN_MS);
    return this.toUtcDateKey(shifted);
  }

  private dateKeyToUtcMidnight(dateKey: string) {
    return new Date(`${dateKey}T00:00:00.000Z`);
  }

  private getTodayDateKey(timezone: string) {
    return this.toTimezoneDateKey(new Date(), timezone);
  }

  private resolveTargetDateKey(date: string | undefined, timezone: string) {
    return date ? this.normalizeDateKey(date) : this.getTodayDateKey(timezone);
  }

  private dateKeyToUtcNoon(dateKey: string) {
    return new Date(`${dateKey}T12:00:00.000Z`);
  }

  private toUtcDateKey(date: Date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getMonthStartDateKey(dateKey: string) {
    return `${dateKey.slice(0, 7)}-01`;
  }

  private getDateKeyRange(startDateKey: string, days: number): [string, string] {
    return [startDateKey, this.shiftDateKey(startDateKey, days - 1)];
  }

  private getMonthRangeDateKeys(dateKey: string): [string, string] {
    const startDateKey = this.getMonthStartDateKey(dateKey);
    const nextMonthDateKey = this.shiftDateKey(startDateKey, 32);
    const endDateKey = this.shiftDateKey(this.getMonthStartDateKey(nextMonthDateKey), -1);
    return [startDateKey, endDateKey];
  }

  private getMonthEndDateKey(dateKey: string) {
    return this.getMonthRangeDateKeys(dateKey)[1];
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

  private async resolveTimezone(userId: string, petId: string, requestedTimezone?: string) {
    if (requestedTimezone) {
      this.assertValidTimezone(requestedTimezone);
      return requestedTimezone;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });

    if (user?.timezone) {
      this.assertValidTimezone(user.timezone);
      return user.timezone;
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
