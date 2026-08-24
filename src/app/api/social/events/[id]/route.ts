import { NextRequest, NextResponse } from 'next/server';
import { socialEventsCollection, currentSocialUser } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await socialEventsCollection();
    const event = await col.findOne({ id: params.id });
    if (!event) return NextResponse.json({ success: false, error: 'No existe' }, { status: 404 });

    const { _id, ...clean } = event as any;
    return NextResponse.json({
      success: true,
      event: {
        ...clean,
        interestedCount: event.interested.length,
        attendingCount: event.attending.length,
        myStatus: event.attending.includes(user.id) ? 'attending' : event.interested.includes(user.id) ? 'interested' : event.notAttending.includes(user.id) ? 'not_attending' : undefined,
        isOrganizer: event.organizerId === user.id,
      },
    });
  } catch (error) {
    console.error('Error obteniendo evento:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
