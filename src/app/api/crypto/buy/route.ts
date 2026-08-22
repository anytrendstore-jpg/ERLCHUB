import { NextRequest, NextResponse } from 'next/server';
import { currentCryptoUser, buyCrypto } from '@/lib/cryptoServer';
import { getHubPayFreeze } from '@/lib/hubPayServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const me = await currentCryptoUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const freeze = await getHubPayFreeze(me.id);
    if (freeze.frozen) return NextResponse.json({ success: false, error: `Tu cuenta de HubPay está congelada por Staff: ${freeze.reason}` }, { status: 403 });

    const { coinId, amount } = await request.json();
    const result = await buyCrypto(me.id, coinId, Number(amount));
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, tx: result.tx });
  } catch (error) {
    console.error('Error comprando cripto:', error);
    return NextResponse.json({ success: false, error: 'No se pudo completar la compra' }, { status: 500 });
  }
}
