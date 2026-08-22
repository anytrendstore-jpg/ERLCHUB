import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentVpsUser, vpsPlansCollection, vpsSubscriptionsCollection, formatDurationLabel } from '@/lib/vpsServer';
import { chargeCrypto, getDefaultCryptoCoin } from '@/lib/cryptoServer';
import { notifyUser } from '@/lib/notificationsServer';

export const dynamic = 'force-dynamic';

/** Paga (solo con Crypto Wallet) y activa una nueva ventana en un solo paso, con la duración real del plan. */
export async function POST(request: NextRequest) {
  const me = await currentVpsUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const subsCol = await vpsSubscriptionsCollection();
    const current = await subsCol.findOne({ discordId: me.id }, { sort: { purchasedAt: -1 } });
    if (current?.status === 'active') return NextResponse.json({ success: false, error: 'Ya tienes un VPS activo' }, { status: 400 });
    if (current?.status === 'inactive') return NextResponse.json({ success: false, error: 'Ya tienes una suscripción pendiente de activar' }, { status: 400 });

    const { planId } = await request.json().catch(() => ({ planId: undefined }));
    const targetPlanId = planId || current?.planId;
    if (!targetPlanId) return NextResponse.json({ success: false, error: 'Falta seleccionar un plan' }, { status: 400 });

    const plansCol = await vpsPlansCollection();
    const plan = await plansCol.findOne({ id: targetPlanId, enabled: true });
    if (!plan) return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });

    const durationHours = plan.durationHours || 24;
    const durationLabel = formatDurationLabel(durationHours);

    const coin = await getDefaultCryptoCoin();
    if (!coin) return NextResponse.json({ success: false, error: 'No hay criptomonedas disponibles' }, { status: 500 });
    const charge = await chargeCrypto(me.id, coin.id, plan.dailyPrice, `VPS ${plan.name} — renovación de ${durationLabel}`);
    if (!charge.ok) return NextResponse.json({ success: false, error: charge.error }, { status: 400 });

    const now = new Date();
    const doc = {
      id: crypto.randomUUID(), discordId: me.id, planId: plan.id, planName: plan.name,
      dailyPrice: plan.dailyPrice, securityLevel: plan.securityLevel, durationHours, status: 'active' as const,
      purchasedAt: now, activatedAt: now, expiresAt: new Date(now.getTime() + durationHours * 60 * 60 * 1000),
      autoRenew: current?.autoRenew || false, warningsSent: [] as string[],
    };
    await subsCol.insertOne(doc);
    await notifyUser(me.id, { title: 'VPS renovado', message: `Renovaste ${plan.name} por otras ${durationLabel}.`, type: 'success', appId: 'vps' });

    return NextResponse.json({ success: true, subscription: doc });
  } catch (error) {
    console.error('Error renovando VPS:', error);
    return NextResponse.json({ success: false, error: 'No se pudo renovar' }, { status: 500 });
  }
}
