import { Controller, Get } from '@nestjs/common';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get('health')
  getHealth() {
    return this.devicesService.getStatus();
  }
}
