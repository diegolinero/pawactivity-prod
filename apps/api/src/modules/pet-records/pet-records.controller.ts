import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateDewormingDto } from './dto/create-deworming.dto';
import { CreateVaccinationDto } from './dto/create-vaccination.dto';
import { CreateVetVisitDto } from './dto/create-vet-visit.dto';
import { CreateWeightRecordDto } from './dto/create-weight-record.dto';
import { UpdateDewormingDto } from './dto/update-deworming.dto';
import { UpdateVaccinationDto } from './dto/update-vaccination.dto';
import { UpdateVetVisitDto } from './dto/update-vet-visit.dto';
import { UpdateWeightRecordDto } from './dto/update-weight-record.dto';
import { PetRecordsService } from './pet-records.service';

@UseGuards(JwtAuthGuard)
@Controller('pets/:petId')
export class PetRecordsController {
  constructor(private readonly petRecordsService: PetRecordsService) {}

  @Get('profile')
  profile(@CurrentUser() user: { id: string }, @Param('petId') petId: string) {
    return this.petRecordsService.getProfile(user.id, petId);
  }

  @Get('weights')
  listWeights(@CurrentUser() user: { id: string }, @Param('petId') petId: string) {
    return this.petRecordsService.listWeights(user.id, petId);
  }

  @Post('weights')
  createWeight(@CurrentUser() user: { id: string }, @Param('petId') petId: string, @Body() body: CreateWeightRecordDto) {
    return this.petRecordsService.createWeight(user.id, petId, body);
  }

  @Patch('weights/:weightId')
  updateWeight(
    @CurrentUser() user: { id: string },
    @Param('petId') petId: string,
    @Param('weightId') weightId: string,
    @Body() body: UpdateWeightRecordDto,
  ) {
    return this.petRecordsService.updateWeight(user.id, petId, weightId, body);
  }

  @Delete('weights/:weightId')
  deleteWeight(@CurrentUser() user: { id: string }, @Param('petId') petId: string, @Param('weightId') weightId: string) {
    return this.petRecordsService.deleteWeight(user.id, petId, weightId);
  }

  @Get('vaccinations')
  listVaccinations(@CurrentUser() user: { id: string }, @Param('petId') petId: string) {
    return this.petRecordsService.listVaccinations(user.id, petId);
  }

  @Post('vaccinations')
  createVaccination(@CurrentUser() user: { id: string }, @Param('petId') petId: string, @Body() body: CreateVaccinationDto) {
    return this.petRecordsService.createVaccination(user.id, petId, body);
  }

  @Patch('vaccinations/:vaccinationId')
  updateVaccination(
    @CurrentUser() user: { id: string },
    @Param('petId') petId: string,
    @Param('vaccinationId') vaccinationId: string,
    @Body() body: UpdateVaccinationDto,
  ) {
    return this.petRecordsService.updateVaccination(user.id, petId, vaccinationId, body);
  }

  @Delete('vaccinations/:vaccinationId')
  deleteVaccination(
    @CurrentUser() user: { id: string },
    @Param('petId') petId: string,
    @Param('vaccinationId') vaccinationId: string,
  ) {
    return this.petRecordsService.deleteVaccination(user.id, petId, vaccinationId);
  }

  @Get('dewormings')
  listDewormings(@CurrentUser() user: { id: string }, @Param('petId') petId: string) {
    return this.petRecordsService.listDewormings(user.id, petId);
  }

  @Post('dewormings')
  createDeworming(@CurrentUser() user: { id: string }, @Param('petId') petId: string, @Body() body: CreateDewormingDto) {
    return this.petRecordsService.createDeworming(user.id, petId, body);
  }

  @Patch('dewormings/:dewormingId')
  updateDeworming(
    @CurrentUser() user: { id: string },
    @Param('petId') petId: string,
    @Param('dewormingId') dewormingId: string,
    @Body() body: UpdateDewormingDto,
  ) {
    return this.petRecordsService.updateDeworming(user.id, petId, dewormingId, body);
  }

  @Delete('dewormings/:dewormingId')
  deleteDeworming(@CurrentUser() user: { id: string }, @Param('petId') petId: string, @Param('dewormingId') dewormingId: string) {
    return this.petRecordsService.deleteDeworming(user.id, petId, dewormingId);
  }

  @Get('vet-visits')
  listVetVisits(@CurrentUser() user: { id: string }, @Param('petId') petId: string) {
    return this.petRecordsService.listVetVisits(user.id, petId);
  }

  @Post('vet-visits')
  createVetVisit(@CurrentUser() user: { id: string }, @Param('petId') petId: string, @Body() body: CreateVetVisitDto) {
    return this.petRecordsService.createVetVisit(user.id, petId, body);
  }

  @Patch('vet-visits/:visitId')
  updateVetVisit(
    @CurrentUser() user: { id: string },
    @Param('petId') petId: string,
    @Param('visitId') visitId: string,
    @Body() body: UpdateVetVisitDto,
  ) {
    return this.petRecordsService.updateVetVisit(user.id, petId, visitId, body);
  }

  @Delete('vet-visits/:visitId')
  deleteVetVisit(@CurrentUser() user: { id: string }, @Param('petId') petId: string, @Param('visitId') visitId: string) {
    return this.petRecordsService.deleteVetVisit(user.id, petId, visitId);
  }
}
