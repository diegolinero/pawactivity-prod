import { cookies } from 'next/headers';

const ACCESS_TOKEN_COOKIE = 'pawactivity_access_token';
const REFRESH_TOKEN_COOKIE = 'pawactivity_refresh_token';

export async function getAccessToken() {
  return (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

export async function getRefreshToken() {
  return (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value ?? null;
}

export async function setSessionCookies(accessToken: string, refreshToken: string) {
  const store = await cookies();
  const common = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };

  store.set(ACCESS_TOKEN_COOKIE, accessToken, common);
  store.set(REFRESH_TOKEN_COOKIE, refreshToken, common);
}

export async function clearSessionCookies() {
  const store = await cookies();
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
}
