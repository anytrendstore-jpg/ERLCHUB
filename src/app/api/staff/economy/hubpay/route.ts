import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { staffIdentity, logStaffAction } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';
import { notifyUser } from '@/lib/notificationsServer';

export const dynamic = 'force-dynamic';

/** Búsqueda de cuentas de HubPay (saldo real + estado de congelamiento) para el panel de Staff. */
export async function GET(request: NextRequest) {
  const denied = await requirePermission('economy.view');
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();

    const db = await connectToDatabase();
    const query: Record<string, unknown> = {};
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ username: rx }, { global_name: rx }, { discordId: rx }];
    } else {
      // Sin búsqueda: mostrar solo cuentas con saldo o congeladas, para no listar miles de jugadores sin actividad bancaria.
      query.$or = [{ hubPayBalance: { $gt: 0 } }, { hubPayFrozen: true }];
    }

    const accounts = await db
      .collection('users')
      .find(query, {
        projection: { discordId: 1, username: 1, global_name: 1, avatar: 1, hubPayBalance: 1, hubPayFrozen: 1, hubPayFrozenReason: 1, hubPayFrozenAt: 1, hubPayFrozenBy: 1 },
      })
      .sort({ hubPayFrozen: -1, hubPayBalance: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      success: true,
      accounts: accounts.map(({ _id, ...a }: any) => ({
        discordId: a.discordId,
        username: a.global_name || a.username || a.discordId,
        avatar: a.avatar,
        balance: a.hubPayBalance || 0,
        frozen: Boolean(a.hubPayFrozen),
        frozenReason: a.hubPayFrozenReason,
        frozenAt: a.hubPayFrozenAt,
        frozenBy: a.hubPayFrozenBy,
      })),
    });
  } catch (error) {
    console.error('Error listando cuentas de HubPay:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** Congela o descongela la cuenta de HubPay de un jugador. Bloquea transferencias/depósitos/retiros/compras/apuestas. */
export async function PATCH(request: NextRequest) {
  const denied = await requirePermission('economy.manage');
  if (denied) return denied;

  try {
    const { discordId, action, reason } = await request.json();
    if (!discordId || (action !== 'freeze' && action !== 'unfreeze')) {
      return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
    }
    if (action === 'freeze' && !reason?.trim()) {
      return NextResponse.json({ success: false, error: 'Indica el motivo del congelamiento' }, { status: 400 });
    }

    const identity = staffIdentity();
    const db = await connectToDatabase();
    const col = db.collection('users');

    if (action === 'freeze') {
      await col.updateOne(
        { discordId },
        { $set: { hubPayFrozen: true, hubPayFrozenReason: reason.trim(), hubPayFrozenAt: new Date(), hubPayFrozenBy: identity?.name || 'Staff' } },
        { upsert: true }
      );
      await notifyUser(discordId, {
        title: 'Cuenta de HubPay congelada',
        message: `Tu cuenta fue congelada por Staff. Motivo: ${reason.trim()}`,
        type: 'error',
        appId: 'hubpay',
      });
      await logStaffAction({
        type: 'hubpay_account_frozen',
        category: 'ECONOMIA',
        actor: identity?.name || 'Director',
        actorId: identity?.id,
        target: discordId,
        description: `${identity?.name || 'Director'} congeló la cuenta de HubPay de ${discordId}: ${reason.trim()}`,
      });
    } else {
      await col.updateOne(
        { discordId },
        { $set: { hubPayFrozen: false }, $unset: { hubPayFrozenReason: '', hubPayFrozenAt: '', hubPayFrozenBy: '' } }
      );
      await notifyUser(discordId, {
        title: 'Cuenta de HubPay reactivada',
        message: 'Tu cuenta de HubPay ya no está congelada.',
        type: 'success',
        appId: 'hubpay',
      });
      await logStaffAction({
        type: 'hubpay_account_unfrozen',
        category: 'ECONOMIA',
        actor: identity?.name || 'Director',
        actorId: identity?.id,
        target: discordId,
        description: `${identity?.name || 'Director'} reactivó la cuenta de HubPay de ${discordId}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error actualizando congelamiento de HubPay:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}
