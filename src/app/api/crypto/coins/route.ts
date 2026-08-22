import { NextResponse } from 'next/server';
import { currentCryptoUser } from '@/lib/cryptoServer';
import { getLiveCoins } from '@/lib/cryptoServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentCryptoUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const coins = await getLiveCoins();
    return NextResponse.json({ success: true, coins: coins.map((c) => ({ ...c, priceHistory: c.priceHistory.slice(-60) })) });
  } catch (error) {
    console.error('Error leyendo mercado cripto:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
