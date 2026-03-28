import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateVaccinationDto {
  @IsString()
  vaccineName!: string;

  @IsDateString()
  applicationDate!: string;

  @IsOptional()
  @IsDateString()
  nextDueDate?: string;

  @IsOptional()
  @IsString()
  veterinarianName?: string;

  @IsOptional()
  @IsString()
  clinicName?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
