import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { SyncActivityDto } from './dto/sync-activity.dto';
import { SyncActivitySummaryDto } from './dto/sync-activity-summary.dto';
import { SyncService } from './sync.service';

@UseGuards(JwtAuthGuard)
@Controller('activity')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('sync')
  @UseGuards(RateLimitGuard)
  @RateLimit({ keyPrefix: 'activity-sync', limit: 120, windowMs: 60_000, scope: 'user' })
  sync(@CurrentUser() user: { id: string }, @Body() body: SyncActivityDto) {
    return this.syncService.syncActivity(user.id, body);
  }

  @Post('summary/sync')
  @UseGuards(RateLimitGuard)
  @RateLimit({ keyPrefix: 'activity-summary-sync', limit: 180, windowMs: 60_000, scope: 'user' })
  syncSummary(@CurrentUser() user: { id: string }, @Body() body: SyncActivitySummaryDto) {
    return this.syncService.syncActivitySummary(user.id, body);
  }
}
