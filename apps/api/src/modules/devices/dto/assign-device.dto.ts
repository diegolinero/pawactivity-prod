import { IsString, MinLength } from 'class-validator';

export class AssignDeviceDto {
  @IsString()
  @MinLength(1)
  deviceId!: string;
}
