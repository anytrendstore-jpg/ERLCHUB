import { NextRequest, NextResponse } from 'next/server';
import { currentCryptoUser, swapCrypto } from '@/lib/cryptoServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const me = await currentCryptoUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { fromCoinId, toCoinId, amount } = await request.json();
    const result = await swapCrypto(me.id, fromCoinId, toCoinId, Number(amount));
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, tx: result.tx, received: result.received });
  } catch (error) {
    console.error('Error intercambiando cripto:', error);
    return NextResponse.json({ success: false, error: 'No se pudo completar el intercambio' }, { status: 500 });
  }
}
