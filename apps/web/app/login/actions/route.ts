import { NextResponse } from 'next/server';
import type { AuthResponse } from '@pawactivity/types';
import { apiFetch } from '@/lib/api';
import { setSessionCookies } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    await setSessionCookies(response.accessToken, response.refreshToken);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: 'Login failed' }, { status: 401 });
  }
}
