import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

enum ActivityTypeDto {
  rest = 'rest',
  walk = 'walk',
  run = 'run',
}

class ActivityEventDto {
  @IsEnum(ActivityTypeDto)
  activityType!: 'rest' | 'walk' | 'run';

  @IsDateString()
  startedAt!: string;

  @IsDateString()
  endedAt!: string;

  @IsInt()
  @Min(1)
  durationSeconds!: number;

  @IsOptional()
  @Min(0)
  @Max(1)
  confidence?: number;
}

export class SyncActivityDto {
  @IsUUID()
  petId!: string;

  @IsUUID()
  deviceId!: string;

  @IsDateString()
  generatedAt!: string;

  @IsString()
  timezone!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  batteryLevel?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ActivityEventDto)
  events!: ActivityEventDto[];
}

export type SyncActivityEventInput = ActivityEventDto;
