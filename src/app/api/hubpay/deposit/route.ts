import { NextRequest, NextResponse } from 'next/server';
import { currentBankUser, adjustBalance, getHubPayFreeze } from '@/lib/hubPayServer';
import { notifyUser } from '@/lib/notificationsServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const me = await currentBankUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const freeze = await getHubPayFreeze(me.id);
    if (freeze.frozen) {
      return NextResponse.json({ success: false, error: `Tu cuenta de HubPay está congelada por Staff${freeze.reason ? `: ${freeze.reason}` : ''}` }, { status: 403 });
    }

    const { amount } = await request.json();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return NextResponse.json({ success: false, error: 'Monto inválido' }, { status: 400 });
    }

    const tx = await adjustBalance({
      discordId: me.id,
      delta: value,
      type: 'deposit',
      description: 'Depósito en efectivo',
    });

    await notifyUser(me.id, {
      title: 'Depósito realizado',
      message: `Depositaste $${value.toLocaleString('es-CO')} en tu cuenta`,
      type: 'success',
      appId: 'hubpay',
    });

    return NextResponse.json({ success: true, transaction: tx });
  } catch (error) {
    console.error('Error procesando depósito:', error);
    return NextResponse.json({ success: false, error: 'No se pudo procesar el depósito' }, { status: 500 });
  }
}
