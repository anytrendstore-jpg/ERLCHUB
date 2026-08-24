import { NextRequest, NextResponse } from 'next/server';
import { socialEventsCollection, currentSocialUser } from '@/lib/socialServer';
import { notifyUser } from '@/lib/notificationsServer';

export const dynamic = 'force-dynamic';

const STATUSES = ['interested', 'attending', 'not_attending'] as const;

/** Confirma/actualiza asistencia a un evento. `status: null` saca al jugador de las tres listas. */
export async function POST(request: NextRequest) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { eventId, status } = await request.json();
    if (!eventId) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });
    if (status !== null && !STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: 'Estado inválido' }, { status: 400 });
    }

    const col = await socialEventsCollection();
    const event = await col.findOne({ id: eventId });
    if (!event) return NextResponse.json({ success: false, error: 'No existe' }, { status: 404 });

    const wasAttending = event.attending.includes(user.id);
    await col.updateOne(
      { id: eventId },
      {
        $pull: { interested: user.id, attending: user.id, notAttending: user.id },
      }
    );
    if (status) {
      const field = status === 'interested' ? 'interested' : status === 'attending' ? 'attending' : 'notAttending';
      await col.updateOne({ id: eventId }, { $addToSet: { [field]: user.id } });
    }

    if (status === 'attending' && !wasAttending && event.organizerId !== user.id) {
      await notifyUser(event.organizerId, {
        title: 'Nueva confirmación de asistencia',
        message: `${user.displayName} va a asistir a "${event.name}"`,
        type: 'info',
        appId: 'hubsocial',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error confirmando asistencia:', error);
    return NextResponse.json({ success: false, error: 'No se pudo procesar' }, { status: 500 });
  }
}
