export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  timezone: string;
  status: 'active' | 'inactive';
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type PetSex = 'male' | 'female' | 'unknown';
export type DeviceStatus = 'inactive' | 'active' | 'assigned';

export type DeviceAssignedPet = {
  id: string;
  name: string;
};

export type DeviceSummary = {
  id: string;
  serialNumber: string;
  model: string;
  firmwareVersion: string | null;
  status: DeviceStatus;
  batteryLevel: number | null;
  lastSeenAt: string | null;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignedPet: DeviceAssignedPet | null;
};

export type PetSummary = {
  id: string;
  name: string;
  breed: string | null;
  birthDate: string | null;
  weightKg: string | null;
  sex: PetSex;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  activeDevice: DeviceSummary | null;
};
