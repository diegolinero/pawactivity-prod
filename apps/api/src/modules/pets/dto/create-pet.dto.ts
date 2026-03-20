import { IsDateString, IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';

enum PetSexDto {
  male = 'male',
  female = 'female',
  unknown = 'unknown',
}

export class CreatePetDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsNumberString()
  weightKg?: string;

  @IsEnum(PetSexDto)
  sex!: 'male' | 'female' | 'unknown';

  @IsOptional()
  @IsString()
  photoUrl?: string;
}
