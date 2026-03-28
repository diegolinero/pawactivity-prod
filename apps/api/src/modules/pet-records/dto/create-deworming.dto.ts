import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateDewormingDto {
  @IsString()
  productName!: string;

  @IsDateString()
  applicationDate!: string;

  @IsOptional()
  @IsDateString()
  nextDueDate?: string;

  @IsOptional()
  @IsString()
  dose?: string;

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
