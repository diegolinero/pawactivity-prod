import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private readonly counters = new Map<string, number>();
  private readonly syncCountByUser = new Map<string, number>();
  private readonly activeSyncUsers = new Set<string>();

  increment(metric: string, value = 1) {
    this.counters.set(metric, (this.counters.get(metric) ?? 0) + value);
  }

  trackSync(userId: string, eventCount: number, duplicatesSkipped: number) {
    this.increment('activity_sync_total');
    this.increment('activity_events_received_total', eventCount);
    this.increment('activity_duplicates_skipped_total', duplicatesSkipped);
    this.activeSyncUsers.add(userId);
    this.syncCountByUser.set(userId, (this.syncCountByUser.get(userId) ?? 0) + 1);
  }

  trackApiRequest(statusCode: number, durationMs: number) {
    this.increment('api_requests_total');
    this.increment(`api_requests_status_${statusCode}`);
    this.increment('api_response_time_ms_total', durationMs);
  }

  snapshot() {
    const apiRequestsTotal = this.counters.get('api_requests_total') ?? 0;
    const apiResponseTimeTotal = this.counters.get('api_response_time_ms_total') ?? 0;
    const syncSuccess = this.counters.get('activity_sync_success_total') ?? 0;
    const syncError = this.counters.get('activity_sync_error_total') ?? 0;
    const syncAttempts = syncSuccess + syncError;

    return {
      counters: Object.fromEntries(this.counters.entries()),
      totals: {
        activeSyncUsers: this.activeSyncUsers.size,
        syncAttempts,
        syncSuccessRate: syncAttempts > 0 ? Number((syncSuccess / syncAttempts).toFixed(4)) : null,
        averageApiResponseMs: apiRequestsTotal > 0 ? Number((apiResponseTimeTotal / apiRequestsTotal).toFixed(2)) : null,
      },
      perUser: {
        syncCount: Object.fromEntries(this.syncCountByUser.entries()),
      },
    };
  }
}
