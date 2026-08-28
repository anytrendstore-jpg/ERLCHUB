import { NextRequest, NextResponse } from 'next/server';
import { createPaymentSource } from '@/lib/wompiServer';
import { membershipSubscriptionsCollection } from '@/lib/membershipSubscriptionsServer';

export const dynamic = 'force-dynamic';

/**
 * Asocia un método de pago tokenizado a una suscripción ya activa (comprada antes de esta
 * fase, o a la que el usuario le había quitado la tarjeta) — no cobra nada en el momento,
 * solo guarda el payment_source_id para que el cron de renovación pueda usarlo después.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, customerEmail, membershipId, cardToken } = await request.json();
    if (!userId || !customerEmail || !membershipId || !cardToken) {
      return NextResponse.json({ success: false, error: 'Datos incompletos' }, { status: 400 });
    }

    const col = await membershipSubscriptionsCollection();
    const subscription = await col.findOne({ userId, membershipId, status: 'active' });
    if (!subscription) {
      return NextResponse.json({ success: false, error: 'No tenés una membresía activa de este tipo' }, { status: 404 });
    }

    const paymentSource = await createPaymentSource({ cardToken, customerEmail });

    await col.updateOne(
      { userId, membershipId, status: 'active' },
      { $set: { paymentSourceId: paymentSource.id, autoRenew: true, failedRenewalAttempts: 0 }, $unset: { nextRetryAt: '' } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error guardando método de pago:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'No se pudo guardar el método de pago' }, { status: 500 });
  }
}
