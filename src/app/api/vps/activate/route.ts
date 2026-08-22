import { NextResponse } from 'next/server';
import { currentVpsUser, vpsSubscriptionsCollection, formatDurationLabel } from '@/lib/vpsServer';
import { notifyUser } from '@/lib/notificationsServer';

export const dynamic = 'force-dynamic';

/** Activa la suscripción comprada y todavía inactiva: arranca la ventana real de duración del plan. */
export async function POST() {
  const me = await currentVpsUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await vpsSubscriptionsCollection();
    const current = await col.findOne({ discordId: me.id }, { sort: { purchasedAt: -1 } });
    if (!current || current.status !== 'inactive') {
      return NextResponse.json({ success: false, error: 'No tienes una suscripción pendiente de activar' }, { status: 400 });
    }

    const durationHours = current.durationHours || 24;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);
    await col.updateOne({ id: current.id }, { $set: { status: 'active', activatedAt: now, expiresAt } });
    await notifyUser(me.id, { title: 'VPS activo', message: `Tu VPS ${current.planName} está activo por las próximas ${formatDurationLabel(durationHours)}.`, type: 'success', appId: 'vps' });

    const fresh = await col.findOne({ id: current.id });
    return NextResponse.json({ success: true, subscription: fresh });
  } catch (error) {
    console.error('Error activando VPS:', error);
    return NextResponse.json({ success: false, error: 'No se pudo activar' }, { status: 500 });
  }
}
