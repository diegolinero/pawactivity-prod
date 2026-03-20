import { IsOptional, IsString, MinLength } from 'class-validator';

export class ActivateDeviceDto {
  @IsString()
  @MinLength(3)
  serialNumber!: string;

  @IsOptional()
  @IsString()
  model?: string;
}
