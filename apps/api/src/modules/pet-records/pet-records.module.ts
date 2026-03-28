import { Module } from '@nestjs/common';
import { PetsModule } from '../pets/pets.module';
import { PetRecordsController } from './pet-records.controller';
import { PetRecordsService } from './pet-records.service';

@Module({
  imports: [PetsModule],
  controllers: [PetRecordsController],
  providers: [PetRecordsService],
})
export class PetRecordsModule {}
