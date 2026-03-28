import { PartialType } from '@nestjs/mapped-types';
import { CreateVetVisitDto } from './create-vet-visit.dto';

export class UpdateVetVisitDto extends PartialType(CreateVetVisitDto) {}
