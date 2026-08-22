import { NextRequest, NextResponse } from 'next/server';
import { currentCryptoUser, sellCrypto } from '@/lib/cryptoServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const me = await currentCryptoUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { coinId, amount } = await request.json();
    const result = await sellCrypto(me.id, coinId, Number(amount));
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, tx: result.tx });
  } catch (error) {
    console.error('Error vendiendo cripto:', error);
    return NextResponse.json({ success: false, error: 'No se pudo completar la venta' }, { status: 500 });
  }
}
