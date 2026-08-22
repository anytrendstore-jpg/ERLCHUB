import { NextRequest, NextResponse } from 'next/server';
import { currentCryptoUser, reportSuspiciousTransaction } from '@/lib/cryptoServer';

export const dynamic = 'force-dynamic';

/** El jugador reporta una transacción de su propia Crypto Wallet que no reconoce. */
export async function POST(request: NextRequest) {
  const me = await currentCryptoUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { txId } = await request.json();
    if (!txId) return NextResponse.json({ success: false, error: 'Falta la transacción' }, { status: 400 });
    const result = await reportSuspiciousTransaction(me.id, txId);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reportando transacción cripto:', error);
    return NextResponse.json({ success: false, error: 'No se pudo enviar el reporte' }, { status: 500 });
  }
}
