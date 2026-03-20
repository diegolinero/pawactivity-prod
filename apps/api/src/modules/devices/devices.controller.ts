import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ActivateDeviceDto } from './dto/activate-device.dto';
import { AssignDeviceDto } from './dto/assign-device.dto';
import { DevicesService } from './devices.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get('devices')
  list(@CurrentUser() user: { id: string }) {
    return this.devicesService.list(user.id);
  }

  @Post('devices/activate')
  activate(@CurrentUser() user: { id: string }, @Body() body: ActivateDeviceDto) {
    return this.devicesService.activate(user.id, body);
  }

  @Get('devices/:deviceId')
  getById(@CurrentUser() user: { id: string }, @Param('deviceId') deviceId: string) {
    return this.devicesService.getById(user.id, deviceId);
  }

  @Get('devices/:deviceId/status')
  getStatus(@CurrentUser() user: { id: string }, @Param('deviceId') deviceId: string) {
    return this.devicesService.getStatus(user.id, deviceId);
  }

  @Post('pets/:petId/devices/assign')
  assignToPet(
    @CurrentUser() user: { id: string },
    @Param('petId') petId: string,
    @Body() body: AssignDeviceDto,
  ) {
    return this.devicesService.assignToPet(user.id, petId, body.deviceId);
  }
}
