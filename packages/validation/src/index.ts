import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().optional().nullable(),
  timezone: z.string().min(1).default('UTC'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const petSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  breed: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  weightKg: z.string().optional().nullable(),
  sex: z.enum(['male', 'female', 'unknown']),
  photoUrl: z.string().url('La foto debe ser una URL válida').optional().or(z.literal('')).nullable(),
});

export const deviceActivationSchema = z.object({
  serialNumber: z.string().min(3, 'El serial es obligatorio'),
});

export const deviceAssignmentSchema = z.object({
  deviceId: z.string().min(1, 'Debes seleccionar un dispositivo'),
});
