import { IsDateString, IsNumberString, IsOptional, IsString } from 'class-validator';

export class CreateWeightRecordDto {
  @IsNumberString()
  weightKg!: string;

  @IsDateString()
  measuredAt!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
