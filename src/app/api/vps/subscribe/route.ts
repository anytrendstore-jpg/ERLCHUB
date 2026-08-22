import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentVpsUser, vpsPlansCollection, vpsSubscriptionsCollection, formatDurationLabel } from '@/lib/vpsServer';
import { chargeCrypto, getDefaultCryptoCoin } from '@/lib/cryptoServer';
import { notifyUser } from '@/lib/notificationsServer';

export const dynamic = 'force-dynamic';

/**
 * Compra una suscripción (queda INACTIVA — el jugador debe activarla manualmente desde VPS Manager).
 * El VPS solo se paga con Crypto Wallet, nunca directamente con saldo del Banco (HubPay).
 */
export async function POST(request: NextRequest) {
  const me = await currentVpsUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { planId } = await request.json();
    const plansCol = await vpsPlansCollection();
    const plan = await plansCol.findOne({ id: planId, enabled: true });
    if (!plan) return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });

    const subsCol = await vpsSubscriptionsCollection();
    const current = await subsCol.findOne({ discordId: me.id }, { sort: { purchasedAt: -1 } });
    if (current?.status === 'active') return NextResponse.json({ success: false, error: 'Ya tienes un VPS activo' }, { status: 400 });
    if (current?.status === 'inactive') return NextResponse.json({ success: false, error: 'Ya tienes una suscripción pendiente de activar' }, { status: 400 });

    const durationHours = plan.durationHours || 24;
    const durationLabel = formatDurationLabel(durationHours);

    const coin = await getDefaultCryptoCoin();
    if (!coin) return NextResponse.json({ success: false, error: 'No hay criptomonedas disponibles' }, { status: 500 });
    const charge = await chargeCrypto(me.id, coin.id, plan.dailyPrice, `VPS ${plan.name} — suscripción de ${durationLabel}`);
    if (!charge.ok) return NextResponse.json({ success: false, error: charge.error }, { status: 400 });

    const doc = {
      id: crypto.randomUUID(), discordId: me.id, planId: plan.id, planName: plan.name,
      dailyPrice: plan.dailyPrice, securityLevel: plan.securityLevel, durationHours, status: 'inactive' as const,
      purchasedAt: new Date(), autoRenew: false, warningsSent: [] as string[],
    };
    await subsCol.insertOne(doc);
    await notifyUser(me.id, { title: 'VPS adquirido', message: `Compraste ${plan.name}. Actívalo desde VPS Manager cuando quieras empezar tu ventana de ${durationLabel}.`, type: 'success', appId: 'vps' });

    return NextResponse.json({ success: true, subscription: doc });
  } catch (error) {
    console.error('Error comprando VPS:', error);
    return NextResponse.json({ success: false, error: 'No se pudo completar la compra' }, { status: 500 });
  }
}
