import { NextResponse } from 'next/server';
import { apiFetchWithSession } from '@/lib/server-api';

export async function POST(request: Request, context: { params: Promise<{ petId: string }> }) {
  try {
    const body = await request.json();
    const { petId } = await context.params;
    await apiFetchWithSession(`/pets/${petId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

    return NextResponse.json({ redirectTo: `/pets/${petId}` });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Request failed' }, { status: 400 });
  }
}
