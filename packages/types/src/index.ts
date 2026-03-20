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
export type ActivityType = 'rest' | 'walk' | 'run';

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

export type DailyActivitySummary = {
  date: string;
  timezone: string;
  restSeconds: number;
  walkSeconds: number;
  runSeconds: number;
  totalActiveSeconds: number;
  hasData: boolean;
};

export type WeeklyActivityResponse = {
  startDate: string;
  endDate: string;
  days: DailyActivitySummary[];
};

export type MonthlyActivityResponse = {
  month: string;
  days: DailyActivitySummary[];
  totals: {
    restSeconds: number;
    walkSeconds: number;
    runSeconds: number;
    totalActiveSeconds: number;
  };
};

export type ActivityTimelineItem = {
  id: string;
  activityType: ActivityType;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  confidence: number | null;
};
