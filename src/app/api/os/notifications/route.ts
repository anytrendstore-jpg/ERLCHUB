import { NextRequest, NextResponse } from 'next/server';
import { currentNotificationsUser, notificationsCollection } from '@/lib/notificationsServer';
import { resolveVpsState } from '@/lib/vpsServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentNotificationsUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    // Revisa expiración/avisos del VPS en cada poll, para que las alertas lleguen aunque el
    // jugador no tenga VPS Manager abierto (no hay cron real en este proyecto).
    await resolveVpsState(user.id).catch(() => {});

    const col = await notificationsCollection();
    const docs = await col.find({ discordId: user.id }).sort({ timestamp: -1 }).limit(50).toArray();
    return NextResponse.json({ success: true, notifications: docs.map(({ _id, ...n }: any) => n) });
  } catch (error) {
    console.error('Error listando notificaciones:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** action: 'read' | 'readAll' | 'clear' */
export async function PATCH(request: NextRequest) {
  const user = await currentNotificationsUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { action, id } = await request.json();
    const col = await notificationsCollection();

    if (action === 'read' && id) {
      await col.updateOne({ id, discordId: user.id }, { $set: { read: true } });
    } else if (action === 'readAll') {
      await col.updateMany({ discordId: user.id, read: false }, { $set: { read: true } });
    } else if (action === 'clear') {
      await col.deleteMany({ discordId: user.id });
    } else {
      return NextResponse.json({ success: false, error: 'Acción inválida' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error actualizando notificaciones:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}
