import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type PetSex } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

@Injectable()
export class PetsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const pets = await this.prisma.pet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        devices: {
          where: { isActive: true },
          orderBy: { assignedAt: 'desc' },
          take: 1,
          include: { device: true },
        },
      },
    });

    return pets.map((pet) => this.serializePet(pet));
  }

  async create(userId: string, dto: CreatePetDto) {
    const pet = await this.prisma.pet.create({
      data: {
        userId,
        name: dto.name,
        breed: dto.breed,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        weightKg: dto.weightKg ? new Prisma.Decimal(dto.weightKg) : undefined,
        sex: dto.sex as PetSex,
        photoUrl: dto.photoUrl || undefined,
      },
      include: {
        devices: {
          where: { isActive: true },
          take: 1,
          include: { device: true },
        },
      },
    });

    return this.serializePet(pet);
  }

  async getById(userId: string, petId: string) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
      include: {
        devices: {
          where: { isActive: true },
          orderBy: { assignedAt: 'desc' },
          take: 1,
          include: { device: true },
        },
      },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    if (pet.userId !== userId) {
      throw new ForbiddenException('You cannot access this pet');
    }

    return this.serializePet(pet);
  }

  async update(userId: string, petId: string, dto: UpdatePetDto) {
    await this.ensureOwnership(userId, petId);

    const pet = await this.prisma.pet.update({
      where: { id: petId },
      data: {
        name: dto.name,
        breed: dto.breed,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : dto.birthDate === null ? null : undefined,
        weightKg: dto.weightKg ? new Prisma.Decimal(dto.weightKg) : dto.weightKg === null ? null : undefined,
        sex: dto.sex as PetSex | undefined,
        photoUrl: dto.photoUrl === '' ? null : dto.photoUrl,
      },
      include: {
        devices: {
          where: { isActive: true },
          orderBy: { assignedAt: 'desc' },
          take: 1,
          include: { device: true },
        },
      },
    });

    return this.serializePet(pet);
  }

  async ensureOwnership(userId: string, petId: string) {
    const pet = await this.prisma.pet.findUnique({ where: { id: petId } });
    if (!pet) {
      throw new NotFoundException('Pet not found');
    }
    if (pet.userId !== userId) {
      throw new ForbiddenException('You cannot access this pet');
    }
    return pet;
  }

  private serializePet(
    pet: Prisma.PetGetPayload<{
      include: {
        devices: { include: { device: true } };
      };
    }>,
  ) {
    const activeAssociation = pet.devices[0];

    return {
      id: pet.id,
      name: pet.name,
      breed: pet.breed,
      birthDate: pet.birthDate ? pet.birthDate.toISOString().slice(0, 10) : null,
      weightKg: pet.weightKg ? pet.weightKg.toString() : null,
      sex: pet.sex,
      photoUrl: pet.photoUrl,
      createdAt: pet.createdAt.toISOString(),
      updatedAt: pet.updatedAt.toISOString(),
      activeDevice: activeAssociation
        ? {
            id: activeAssociation.device.id,
            serialNumber: activeAssociation.device.serialNumber,
            model: activeAssociation.device.model,
            firmwareVersion: activeAssociation.device.firmwareVersion,
            status: activeAssociation.device.status,
            batteryLevel: activeAssociation.device.batteryLevel,
            lastSeenAt: activeAssociation.device.lastSeenAt?.toISOString() ?? null,
            activatedAt: activeAssociation.device.activatedAt?.toISOString() ?? null,
            createdAt: activeAssociation.device.createdAt.toISOString(),
            updatedAt: activeAssociation.device.updatedAt.toISOString(),
          }
        : null,
    };
  }
}
