import { NextResponse } from 'next/server';
import { apiFetchWithSession } from '@/lib/server-api';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await apiFetchWithSession('/devices/activate', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Request failed' }, { status: 400 });
  }
}
