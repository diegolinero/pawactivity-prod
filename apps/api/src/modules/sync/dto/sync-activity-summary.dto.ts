import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class SyncActivitySummaryDto {
  @IsUUID()
  petId!: string;

  @IsUUID()
  deviceId!: string;

  @IsDateString()
  generatedAt!: string;

  @IsString()
  timezone!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  summaryDate!: string;

  @IsInt()
  @Min(0)
  restSeconds!: number;

  @IsInt()
  @Min(0)
  walkSeconds!: number;

  @IsInt()
  @Min(0)
  runSeconds!: number;

  @IsInt()
  @Min(0)
  totalActiveSeconds!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  batteryLevel?: number;
}
