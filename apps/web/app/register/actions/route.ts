import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';
import { setSessionCookies } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await apiFetch<{ accessToken: string; refreshToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    await setSessionCookies(response.accessToken, response.refreshToken);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: 'Register failed' }, { status: 400 });
  }
}
