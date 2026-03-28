import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateVetVisitDto {
  @IsDateString()
  visitDate!: string;

  @IsOptional()
  @IsString()
  veterinarianName?: string;

  @IsOptional()
  @IsString()
  clinicName?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  treatment?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
