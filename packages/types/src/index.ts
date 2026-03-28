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

export type AuthSessionInfo = {
  sessionId: string;
  deviceName: string | null;
  expiresAt: string;
};

export type AuthResponse = AuthTokens & {
  tokenType: 'Bearer';
  accessTokenExpiresInSeconds: number;
  refreshTokenExpiresInSeconds: number;
  session: AuthSessionInfo;
  user: AuthUser;
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

export type PetWeightRecord = {
  id: string;
  petId: string;
  weightKg: string;
  measuredAt: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PetVaccination = {
  id: string;
  petId: string;
  vaccineName: string;
  applicationDate: string;
  nextDueDate: string | null;
  veterinarianName: string | null;
  clinicName: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PetDeworming = {
  id: string;
  petId: string;
  productName: string;
  applicationDate: string;
  nextDueDate: string | null;
  dose: string | null;
  veterinarianName: string | null;
  clinicName: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PetVetVisit = {
  id: string;
  petId: string;
  visitDate: string;
  veterinarianName: string | null;
  clinicName: string | null;
  reason: string | null;
  diagnosis: string | null;
  treatment: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PetProfileResponse = {
  petId: string;
  currentWeightKg: string | null;
  weightHistory: PetWeightRecord[];
  vaccinations: PetVaccination[];
  dewormings: PetDeworming[];
  vetVisits: PetVetVisit[];
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

export type ActivitySyncResponse = {
  success: true;
  syncLogId: string;
  recordsReceived: number;
  storedEvents: number;
  skippedDuplicates: number;
  syncedAt: string;
  updatedDates: string[];
};
