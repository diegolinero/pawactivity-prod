import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';
import { clearSessionCookies, getRefreshToken } from '@/lib/session';

export async function POST() {
  try {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    }
  } catch {
    // intentionally swallow logout errors and clear local session anyway
  }

  await clearSessionCookies();
  return NextResponse.redirect(new URL('/login', 'http://localhost:3000'));
}
