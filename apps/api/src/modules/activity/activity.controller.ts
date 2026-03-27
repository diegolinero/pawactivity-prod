import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ActivityService } from './activity.service';

@UseGuards(JwtAuthGuard)
@Controller('pets/:petId/activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('daily')
  daily(
    @CurrentUser() user: { id: string },
    @Param('petId') petId: string,
    @Query('date') date?: string,
    @Query('timezone') timezone?: string,
  ) {
    return this.activityService.getDaily(user.id, petId, date, timezone);
  }

  @Get('weekly')
  weekly(
    @CurrentUser() user: { id: string },
    @Param('petId') petId: string,
    @Query('startDate') startDate?: string,
    @Query('timezone') timezone?: string,
  ) {
    // timezone-aware weekly range (aligned with mobile summary_date keys)
    return this.activityService.getWeekly(user.id, petId, startDate, timezone);
  }

  @Get('monthly')
  monthly(
    @CurrentUser() user: { id: string },
    @Param('petId') petId: string,
    @Query('month') month?: string,
    @Query('timezone') timezone?: string,
  ) {
    return this.activityService.getMonthly(user.id, petId, month, timezone);
  }

  @Get('history')
  history(
    @CurrentUser() user: { id: string },
    @Param('petId') petId: string,
    @Query('range') range?: 'today' | 'week' | 'month',
    @Query('timezone') timezone?: string,
  ) {
    return this.activityService.getHistory(user.id, petId, range, timezone);
  }

  @Get('timeline')
  timeline(
    @CurrentUser() user: { id: string },
    @Param('petId') petId: string,
    @Query('date') date?: string,
    @Query('timezone') timezone?: string,
  ) {
    return this.activityService.getTimeline(user.id, petId, date, timezone);
  }
}
