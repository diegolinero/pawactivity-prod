import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PetsService } from '../pets/pets.service';
import { CreateDewormingDto } from './dto/create-deworming.dto';
import { CreateVaccinationDto } from './dto/create-vaccination.dto';
import { CreateVetVisitDto } from './dto/create-vet-visit.dto';
import { CreateWeightRecordDto } from './dto/create-weight-record.dto';
import { UpdateDewormingDto } from './dto/update-deworming.dto';
import { UpdateVaccinationDto } from './dto/update-vaccination.dto';
import { UpdateVetVisitDto } from './dto/update-vet-visit.dto';
import { UpdateWeightRecordDto } from './dto/update-weight-record.dto';

@Injectable()
export class PetRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly petsService: PetsService,
  ) {}

  async getProfile(userId: string, petId: string) {
    await this.petsService.ensureOwnership(userId, petId);

    const [pet, weightHistory, vaccinations, dewormings, vetVisits] = await Promise.all([
      this.prisma.pet.findUniqueOrThrow({ where: { id: petId }, select: { id: true, weightKg: true } }),
      this.prisma.petWeightRecord.findMany({ where: { petId, deletedAt: null }, orderBy: { measuredAt: 'desc' } }),
      this.prisma.petVaccination.findMany({ where: { petId, deletedAt: null }, orderBy: { applicationDate: 'desc' } }),
      this.prisma.petDeworming.findMany({ where: { petId, deletedAt: null }, orderBy: { applicationDate: 'desc' } }),
      this.prisma.petVetVisit.findMany({ where: { petId, deletedAt: null }, orderBy: { visitDate: 'desc' } }),
    ]);

    return {
      petId: pet.id,
      currentWeightKg: pet.weightKg ? pet.weightKg.toString() : null,
      weightHistory: weightHistory.map((item) => this.serializeWeightRecord(item)),
      vaccinations: vaccinations.map((item) => this.serializeVaccination(item)),
      dewormings: dewormings.map((item) => this.serializeDeworming(item)),
      vetVisits: vetVisits.map((item) => this.serializeVetVisit(item)),
    };
  }

  async listWeights(userId: string, petId: string) {
    await this.petsService.ensureOwnership(userId, petId);
    const records = await this.prisma.petWeightRecord.findMany({ where: { petId, deletedAt: null }, orderBy: { measuredAt: 'desc' } });
    return records.map((record) => this.serializeWeightRecord(record));
  }

  async createWeight(userId: string, petId: string, dto: CreateWeightRecordDto) {
    await this.petsService.ensureOwnership(userId, petId);

    const record = await this.prisma.$transaction(async (tx) => {
      const created = await tx.petWeightRecord.create({
        data: {
          petId,
          weightKg: new Prisma.Decimal(dto.weightKg),
          measuredAt: new Date(dto.measuredAt),
          note: dto.note || null,
        },
      });

      await this.recalculateCurrentWeight(petId, tx);
      return created;
    });

    return this.serializeWeightRecord(record);
  }

  async updateWeight(userId: string, petId: string, weightId: string, dto: UpdateWeightRecordDto) {
    await this.petsService.ensureOwnership(userId, petId);
    const existing = await this.prisma.petWeightRecord.findFirst({ where: { id: weightId, petId, deletedAt: null } });
    if (!existing) {
      throw new NotFoundException('Weight record not found');
    }

    const record = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.petWeightRecord.update({
        where: { id: existing.id },
        data: {
          weightKg: dto.weightKg ? new Prisma.Decimal(dto.weightKg) : undefined,
          measuredAt: dto.measuredAt ? new Date(dto.measuredAt) : undefined,
          note: dto.note,
        },
      });

      await this.recalculateCurrentWeight(petId, tx);
      return updated;
    });

    return this.serializeWeightRecord(record);
  }

  async deleteWeight(userId: string, petId: string, weightId: string) {
    await this.petsService.ensureOwnership(userId, petId);
    const existing = await this.prisma.petWeightRecord.findFirst({ where: { id: weightId, petId, deletedAt: null } });
    if (!existing) {
      throw new NotFoundException('Weight record not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.petWeightRecord.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });
      await this.recalculateCurrentWeight(petId, tx);
    });

    return { success: true };
  }

  async listVaccinations(userId: string, petId: string) {
    await this.petsService.ensureOwnership(userId, petId);
    const records = await this.prisma.petVaccination.findMany({ where: { petId, deletedAt: null }, orderBy: { applicationDate: 'desc' } });
    return records.map((record) => this.serializeVaccination(record));
  }

  async createVaccination(userId: string, petId: string, dto: CreateVaccinationDto) {
    await this.petsService.ensureOwnership(userId, petId);
    const record = await this.prisma.petVaccination.create({
      data: {
        petId,
        vaccineName: dto.vaccineName,
        applicationDate: this.dateOnly(dto.applicationDate),
        nextDueDate: dto.nextDueDate ? this.dateOnly(dto.nextDueDate) : null,
        veterinarianName: dto.veterinarianName || null,
        clinicName: dto.clinicName || null,
        note: dto.note || null,
      },
    });
    return this.serializeVaccination(record);
  }

  async updateVaccination(userId: string, petId: string, vaccinationId: string, dto: UpdateVaccinationDto) {
    await this.petsService.ensureOwnership(userId, petId);
    const existing = await this.prisma.petVaccination.findFirst({ where: { id: vaccinationId, petId, deletedAt: null } });
    if (!existing) {
      throw new NotFoundException('Vaccination record not found');
    }

    const record = await this.prisma.petVaccination.update({
      where: { id: existing.id },
      data: {
        vaccineName: dto.vaccineName,
        applicationDate: dto.applicationDate ? this.dateOnly(dto.applicationDate) : undefined,
        nextDueDate: dto.nextDueDate ? this.dateOnly(dto.nextDueDate) : undefined,
        veterinarianName: dto.veterinarianName,
        clinicName: dto.clinicName,
        note: dto.note,
      },
    });

    return this.serializeVaccination(record);
  }

  async deleteVaccination(userId: string, petId: string, vaccinationId: string) {
    await this.petsService.ensureOwnership(userId, petId);
    const existing = await this.prisma.petVaccination.findFirst({ where: { id: vaccinationId, petId, deletedAt: null } });
    if (!existing) {
      throw new NotFoundException('Vaccination record not found');
    }

    await this.prisma.petVaccination.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  async listDewormings(userId: string, petId: string) {
    await this.petsService.ensureOwnership(userId, petId);
    const records = await this.prisma.petDeworming.findMany({ where: { petId, deletedAt: null }, orderBy: { applicationDate: 'desc' } });
    return records.map((record) => this.serializeDeworming(record));
  }

  async createDeworming(userId: string, petId: string, dto: CreateDewormingDto) {
    await this.petsService.ensureOwnership(userId, petId);
    const record = await this.prisma.petDeworming.create({
      data: {
        petId,
        productName: dto.productName,
        applicationDate: this.dateOnly(dto.applicationDate),
        nextDueDate: dto.nextDueDate ? this.dateOnly(dto.nextDueDate) : null,
        dose: dto.dose || null,
        veterinarianName: dto.veterinarianName || null,
        clinicName: dto.clinicName || null,
        note: dto.note || null,
      },
    });
    return this.serializeDeworming(record);
  }

  async updateDeworming(userId: string, petId: string, dewormingId: string, dto: UpdateDewormingDto) {
    await this.petsService.ensureOwnership(userId, petId);
    const existing = await this.prisma.petDeworming.findFirst({ where: { id: dewormingId, petId, deletedAt: null } });
    if (!existing) {
      throw new NotFoundException('Deworming record not found');
    }

    const record = await this.prisma.petDeworming.update({
      where: { id: existing.id },
      data: {
        productName: dto.productName,
        applicationDate: dto.applicationDate ? this.dateOnly(dto.applicationDate) : undefined,
        nextDueDate: dto.nextDueDate ? this.dateOnly(dto.nextDueDate) : undefined,
        dose: dto.dose,
        veterinarianName: dto.veterinarianName,
        clinicName: dto.clinicName,
        note: dto.note,
      },
    });

    return this.serializeDeworming(record);
  }

  async deleteDeworming(userId: string, petId: string, dewormingId: string) {
    await this.petsService.ensureOwnership(userId, petId);
    const existing = await this.prisma.petDeworming.findFirst({ where: { id: dewormingId, petId, deletedAt: null } });
    if (!existing) {
      throw new NotFoundException('Deworming record not found');
    }

    await this.prisma.petDeworming.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  async listVetVisits(userId: string, petId: string) {
    await this.petsService.ensureOwnership(userId, petId);
    const records = await this.prisma.petVetVisit.findMany({ where: { petId, deletedAt: null }, orderBy: { visitDate: 'desc' } });
    return records.map((record) => this.serializeVetVisit(record));
  }

  async createVetVisit(userId: string, petId: string, dto: CreateVetVisitDto) {
    await this.petsService.ensureOwnership(userId, petId);
    const record = await this.prisma.petVetVisit.create({
      data: {
        petId,
        visitDate: this.dateOnly(dto.visitDate),
        veterinarianName: dto.veterinarianName || null,
        clinicName: dto.clinicName || null,
        reason: dto.reason || null,
        diagnosis: dto.diagnosis || null,
        treatment: dto.treatment || null,
        note: dto.note || null,
      },
    });
    return this.serializeVetVisit(record);
  }

  async updateVetVisit(userId: string, petId: string, visitId: string, dto: UpdateVetVisitDto) {
    await this.petsService.ensureOwnership(userId, petId);
    const existing = await this.prisma.petVetVisit.findFirst({ where: { id: visitId, petId, deletedAt: null } });
    if (!existing) {
      throw new NotFoundException('Vet visit record not found');
    }

    const record = await this.prisma.petVetVisit.update({
      where: { id: existing.id },
      data: {
        visitDate: dto.visitDate ? this.dateOnly(dto.visitDate) : undefined,
        veterinarianName: dto.veterinarianName,
        clinicName: dto.clinicName,
        reason: dto.reason,
        diagnosis: dto.diagnosis,
        treatment: dto.treatment,
        note: dto.note,
      },
    });

    return this.serializeVetVisit(record);
  }

  async deleteVetVisit(userId: string, petId: string, visitId: string) {
    await this.petsService.ensureOwnership(userId, petId);
    const existing = await this.prisma.petVetVisit.findFirst({ where: { id: visitId, petId, deletedAt: null } });
    if (!existing) {
      throw new NotFoundException('Vet visit record not found');
    }

    await this.prisma.petVetVisit.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  private async recalculateCurrentWeight(petId: string, tx: Prisma.TransactionClient) {
    const latest = await tx.petWeightRecord.findFirst({
      where: { petId, deletedAt: null },
      orderBy: [{ measuredAt: 'desc' }, { createdAt: 'desc' }],
      select: { weightKg: true },
    });

    await tx.pet.update({
      where: { id: petId },
      data: {
        weightKg: latest?.weightKg ?? null,
      },
    });
  }

  private dateOnly(input: string) {
    return new Date(`${input.slice(0, 10)}T00:00:00.000Z`);
  }

  private serializeWeightRecord(record: any) {
    return {
      id: record.id,
      petId: record.petId,
      weightKg: record.weightKg.toString(),
      measuredAt: record.measuredAt.toISOString(),
      note: record.note,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  private serializeVaccination(record: any) {
    return {
      id: record.id,
      petId: record.petId,
      vaccineName: record.vaccineName,
      applicationDate: record.applicationDate.toISOString().slice(0, 10),
      nextDueDate: record.nextDueDate ? record.nextDueDate.toISOString().slice(0, 10) : null,
      veterinarianName: record.veterinarianName,
      clinicName: record.clinicName,
      note: record.note,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  private serializeDeworming(record: any) {
    return {
      id: record.id,
      petId: record.petId,
      productName: record.productName,
      applicationDate: record.applicationDate.toISOString().slice(0, 10),
      nextDueDate: record.nextDueDate ? record.nextDueDate.toISOString().slice(0, 10) : null,
      dose: record.dose,
      veterinarianName: record.veterinarianName,
      clinicName: record.clinicName,
      note: record.note,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  private serializeVetVisit(record: any) {
    return {
      id: record.id,
      petId: record.petId,
      visitDate: record.visitDate.toISOString().slice(0, 10),
      veterinarianName: record.veterinarianName,
      clinicName: record.clinicName,
      reason: record.reason,
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      note: record.note,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
