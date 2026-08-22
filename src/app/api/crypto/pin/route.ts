import { NextRequest, NextResponse } from 'next/server';
import { currentCryptoUser, setWalletPin, disableWalletPin } from '@/lib/cryptoServer';

export const dynamic = 'force-dynamic';

/** Define o cambia el PIN de seguridad de la Crypto Wallet. */
export async function POST(request: NextRequest) {
  const me = await currentCryptoUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { pin } = await request.json();
    const result = await setWalletPin(me.id, String(pin || ''));
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error configurando PIN de Crypto Wallet:', error);
    return NextResponse.json({ success: false, error: 'No se pudo configurar el PIN' }, { status: 500 });
  }
}

/** Desactiva el PIN de seguridad. */
export async function DELETE() {
  const me = await currentCryptoUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    await disableWalletPin(me.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error desactivando PIN de Crypto Wallet:', error);
    return NextResponse.json({ success: false, error: 'No se pudo desactivar el PIN' }, { status: 500 });
  }
}
