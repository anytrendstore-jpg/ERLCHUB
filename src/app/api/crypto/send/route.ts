import { NextRequest, NextResponse } from 'next/server';
import { currentCryptoUser, sendCrypto } from '@/lib/cryptoServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const me = await currentCryptoUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { coinId, amount, recipientId, note, pin } = await request.json();
    if (!recipientId) return NextResponse.json({ success: false, error: 'Falta el destinatario' }, { status: 400 });
    const result = await sendCrypto(me.id, coinId, Number(amount), recipientId, note, pin);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, tx: result.tx, unusual: result.unusual });
  } catch (error) {
    console.error('Error enviando cripto:', error);
    return NextResponse.json({ success: false, error: 'No se pudo completar el envío' }, { status: 500 });
  }
}
