import { NextRequest, NextResponse } from 'next/server';
import { currentBankUser, getBalance, adjustBalance, getHubPayFreeze } from '@/lib/hubPayServer';
import { notifyUser } from '@/lib/notificationsServer';

export const dynamic = 'force-dynamic';

const DAILY_LIMIT = 50000;

export async function POST(request: NextRequest) {
  const me = await currentBankUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const freeze = await getHubPayFreeze(me.id);
    if (freeze.frozen) {
      return NextResponse.json({ success: false, error: `Tu cuenta de HubPay está congelada por Staff${freeze.reason ? `: ${freeze.reason}` : ''}` }, { status: 403 });
    }

    const { amount, method } = await request.json();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return NextResponse.json({ success: false, error: 'Monto inválido' }, { status: 400 });
    }
    if (value > DAILY_LIMIT) {
      return NextResponse.json({ success: false, error: `El límite diario es $${DAILY_LIMIT.toLocaleString()}` }, { status: 400 });
    }

    const balance = await getBalance(me.id);
    if (balance < value) return NextResponse.json({ success: false, error: 'Saldo insuficiente' }, { status: 400 });

    const methodLabel = method === 'bank' ? 'Banco' : method === 'crypto' ? 'Crypto' : 'Efectivo';
    const tx = await adjustBalance({
      discordId: me.id,
      delta: -value,
      type: 'withdrawal',
      description: `Retiro - ${methodLabel}`,
      metadata: { method },
    });

    await notifyUser(me.id, {
      title: 'Retiro realizado',
      message: `Retiraste $${value.toLocaleString('es-CO')} vía ${methodLabel}`,
      type: 'info',
      appId: 'hubpay',
    });

    return NextResponse.json({ success: true, transaction: tx });
  } catch (error) {
    console.error('Error procesando retiro:', error);
    return NextResponse.json({ success: false, error: 'No se pudo procesar el retiro' }, { status: 500 });
  }
}
