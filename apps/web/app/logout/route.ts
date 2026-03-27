import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';
import { getRefreshToken } from '@/lib/session';

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

  const response = new NextResponse(null, { status: 204 });
  response.cookies.delete('pawactivity_access_token');
  response.cookies.delete('pawactivity_refresh_token');

  return response;
}
