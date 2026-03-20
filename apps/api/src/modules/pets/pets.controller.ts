import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { PetsService } from './pets.service';

@UseGuards(JwtAuthGuard)
@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.petsService.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() body: CreatePetDto) {
    return this.petsService.create(user.id, body);
  }

  @Get(':petId')
  getById(@CurrentUser() user: { id: string }, @Param('petId') petId: string) {
    return this.petsService.getById(user.id, petId);
  }

  @Patch(':petId')
  update(@CurrentUser() user: { id: string }, @Param('petId') petId: string, @Body() body: UpdatePetDto) {
    return this.petsService.update(user.id, petId, body);
  }
}
