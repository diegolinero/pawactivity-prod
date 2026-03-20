import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PetsService } from '../pets/pets.service';
import { ActivateDeviceDto } from './dto/activate-device.dto';

@Injectable()
export class DevicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly petsService: PetsService,
  ) {}

  async list(userId: string) {
    const devices = await this.prisma.device.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        pets: {
          where: { isActive: true },
          include: { pet: true },
          take: 1,
        },
      },
    });

    return devices.map((device) => this.serializeDevice(device));
  }

  async activate(userId: string, dto: ActivateDeviceDto) {
    const existing = await this.prisma.device.findUnique({ where: { serialNumber: dto.serialNumber } });

    if (existing && existing.userId && existing.userId !== userId) {
      throw new ForbiddenException('This device belongs to another user');
    }

    const device = existing
      ? await this.prisma.device.update({
          where: { id: existing.id },
          data: {
            userId,
            status: 'active',
            model: existing.model || dto.model || 'PawActivity Tracker',
            activatedAt: existing.activatedAt ?? new Date(),
          },
          include: {
            pets: { where: { isActive: true }, include: { pet: true }, take: 1 },
          },
        })
      : await this.prisma.device.create({
          data: {
            userId,
            serialNumber: dto.serialNumber,
            model: dto.model || 'PawActivity Tracker',
            status: 'active',
            activatedAt: new Date(),
          },
          include: {
            pets: { where: { isActive: true }, include: { pet: true }, take: 1 },
          },
        });

    return this.serializeDevice(device);
  }

  async getById(userId: string, deviceId: string) {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        pets: {
          where: { isActive: true },
          include: { pet: true },
          take: 1,
        },
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (device.userId !== userId) {
      throw new ForbiddenException('You cannot access this device');
    }

    return this.serializeDevice(device);
  }

  async getStatus(userId: string, deviceId: string) {
    return this.getById(userId, deviceId);
  }

  async assignToPet(userId: string, petId: string, deviceId: string) {
    await this.petsService.ensureOwnership(userId, petId);
    const device = await this.prisma.device.findUnique({ where: { id: deviceId } });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (device.userId !== userId) {
      throw new ForbiddenException('You cannot assign this device');
    }

    await this.prisma.$transaction(async (tx) => {
      const activeAssociations = await tx.petDevice.findMany({
        where: {
          OR: [
            { petId, isActive: true },
            { deviceId, isActive: true },
          ],
        },
      });

      const deviceIdsToReactivate = [...new Set(activeAssociations.map((association) => association.deviceId).filter((id) => id !== deviceId))];

      await tx.petDevice.updateMany({
        where: {
          OR: [
            { petId, isActive: true },
            { deviceId, isActive: true },
          ],
        },
        data: {
          isActive: false,
          unassignedAt: new Date(),
        },
      });

      if (deviceIdsToReactivate.length > 0) {
        await tx.device.updateMany({
          where: { id: { in: deviceIdsToReactivate } },
          data: { status: 'active' },
        });
      }

      await tx.petDevice.create({
        data: {
          petId,
          deviceId,
          isActive: true,
        },
      });

      await tx.device.update({
        where: { id: deviceId },
        data: { status: 'assigned' },
      });
    });

    return this.getById(userId, deviceId);
  }

  private serializeDevice(device: any) {
    const assigned = device.pets?.[0];

    return {
      id: device.id,
      serialNumber: device.serialNumber,
      model: device.model,
      firmwareVersion: device.firmwareVersion,
      status: device.status,
      batteryLevel: device.batteryLevel,
      lastSeenAt: device.lastSeenAt?.toISOString?.() ?? null,
      activatedAt: device.activatedAt?.toISOString?.() ?? null,
      createdAt: device.createdAt.toISOString(),
      updatedAt: device.updatedAt.toISOString(),
      assignedPet: assigned
        ? {
            id: assigned.pet.id,
            name: assigned.pet.name,
          }
        : null,
    };
  }
}
