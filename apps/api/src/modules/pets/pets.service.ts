import { Injectable } from '@nestjs/common';

@Injectable()
export class PetsService {
  getStatus() {
    return { module: 'pets', implemented: false };
  }
}
