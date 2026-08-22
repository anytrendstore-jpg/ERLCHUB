import { NextRequest, NextResponse } from 'next/server';
import { currentVpsUser, vpsSubscriptionsCollection } from '@/lib/vpsServer';

export const dynamic = 'force-dynamic';

/** Activa/desactiva la renovación automática de la suscripción activa. */
export async function PATCH(request: NextRequest) {
  const me = await currentVpsUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { autoRenew } = await request.json();
    const col = await vpsSubscriptionsCollection();
    const current = await col.findOne({ discordId: me.id }, { sort: { purchasedAt: -1 } });
    if (!current || current.status !== 'active') {
      return NextResponse.json({ success: false, error: 'No tienes un VPS activo' }, { status: 400 });
    }

    await col.updateOne({ id: current.id }, { $set: { autoRenew: Boolean(autoRenew) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error actualizando renovación automática:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}
