import { NextRequest, NextResponse } from 'next/server';
import { currentCareerUser } from '@/lib/hubCareerServer';
import { rsvpEvent } from '@/lib/hubCareerJobsServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { eventId, attending } = await request.json();
    if (!eventId || typeof attending !== 'boolean') return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
    const result = await rsvpEvent(me.id, eventId, attending);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error respondiendo evento de HubCareer:', error);
    return NextResponse.json({ success: false, error: 'No se pudo procesar' }, { status: 500 });
  }
}
