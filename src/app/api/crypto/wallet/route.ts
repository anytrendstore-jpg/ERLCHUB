import { NextResponse } from 'next/server';
import { currentCryptoUser, getWalletSummary, getOrCreateWallet } from '@/lib/cryptoServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentCryptoUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const [summary, wallet] = await Promise.all([getWalletSummary(me.id), getOrCreateWallet(me.id)]);
    return NextResponse.json({ success: true, ...summary, pinEnabled: wallet.pinEnabled });
  } catch (error) {
    console.error('Error leyendo Crypto Wallet:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
