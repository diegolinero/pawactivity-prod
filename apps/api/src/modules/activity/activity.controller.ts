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
  ) {
    return this.activityService.getDaily(user.id, petId, date);
  }

  @Get('weekly')
  weekly(
    @CurrentUser() user: { id: string },
    @Param('petId') petId: string,
    @Query('startDate') startDate?: string,
  ) {
    return this.activityService.getWeekly(user.id, petId, startDate);
  }

  @Get('monthly')
  monthly(
    @CurrentUser() user: { id: string },
    @Param('petId') petId: string,
    @Query('month') month?: string,
  ) {
    return this.activityService.getMonthly(user.id, petId, month);
  }

  @Get('history')
  history(
    @CurrentUser() user: { id: string },
    @Param('petId') petId: string,
    @Query('range') range?: 'today' | 'week' | 'month',
  ) {
    return this.activityService.getHistory(user.id, petId, range);
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
