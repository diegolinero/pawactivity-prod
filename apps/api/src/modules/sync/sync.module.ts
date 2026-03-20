import { Module } from '@nestjs/common';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { DevicesModule } from '../devices/devices.module';
import { PetsModule } from '../pets/pets.module';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [PetsModule, DevicesModule],
  controllers: [SyncController],
  providers: [SyncService, RateLimitGuard],
})
export class SyncModule {}
