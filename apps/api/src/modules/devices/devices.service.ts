import { Injectable } from '@nestjs/common';

@Injectable()
export class DevicesService {
  getStatus() {
    return { module: 'devices', implemented: false };
  }
}
