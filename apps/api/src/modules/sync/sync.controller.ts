import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SyncActivityDto } from './dto/sync-activity.dto';
import { SyncService } from './sync.service';

@UseGuards(JwtAuthGuard)
@Controller('activity')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('sync')
  sync(@CurrentUser() user: { id: string }, @Body() body: SyncActivityDto) {
    return this.syncService.syncActivity(user.id, body);
  }
}
