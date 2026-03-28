import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PetsModule } from './modules/pets/pets.module';
import { DevicesModule } from './modules/devices/devices.module';
import { ActivityModule } from './modules/activity/activity.module';
import { SyncModule } from './modules/sync/sync.module';
import { HealthModule } from './modules/health/health.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { PrismaModule } from './prisma/prisma.module';
import { PetRecordsModule } from './modules/pet-records/pet-records.module';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 20,
      },
    ]),

    MetricsModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    PetsModule,
    DevicesModule,
    ActivityModule,
    PetRecordsModule,
    SyncModule,
    HealthModule,
  ],
})
export class AppModule {}
