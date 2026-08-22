import { NextRequest, NextResponse } from 'next/server';
import { currentCryptoUser, getLiveCoins, ensureAddress } from '@/lib/cryptoServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const me = await currentCryptoUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const coinId = request.nextUrl.searchParams.get('coinId');
    const coins = await getLiveCoins();
    const coin = coinId ? coins.find((c) => c.id === coinId) : coins[0];
    if (!coin) return NextResponse.json({ success: false, error: 'Moneda no encontrada' }, { status: 404 });
    const address = await ensureAddress(me.id, coin);
    return NextResponse.json({ success: true, address, coinId: coin.id, symbol: coin.symbol });
  } catch (error) {
    console.error('Error generando dirección cripto:', error);
    return NextResponse.json({ success: false, error: 'No se pudo generar la dirección' }, { status: 500 });
  }
}
