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
