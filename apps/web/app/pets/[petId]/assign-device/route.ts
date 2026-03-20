import { NextResponse } from 'next/server';
import { apiFetchWithSession } from '@/lib/server-api';

export async function POST(request: Request, context: { params: Promise<{ petId: string }> }) {
  try {
    const body = await request.json();
    const { petId } = await context.params;
    await apiFetchWithSession(`/pets/${petId}/devices/assign`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Request failed' }, { status: 400 });
  }
}
