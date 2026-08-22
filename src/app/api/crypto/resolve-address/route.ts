import { NextRequest, NextResponse } from 'next/server';
import { currentCryptoUser, resolveAddressOwner } from '@/lib/cryptoServer';

export const dynamic = 'force-dynamic';

/** Resuelve una dirección cripto ("escanear"/pegar) al jugador dueño, para autocompletar el envío. */
export async function GET(request: NextRequest) {
  const me = await currentCryptoUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const address = request.nextUrl.searchParams.get('address');
    if (!address) return NextResponse.json({ success: false, error: 'Falta la dirección' }, { status: 400 });

    const owner = await resolveAddressOwner(address);
    if (!owner) return NextResponse.json({ success: false, error: 'No se encontró ningún jugador con esa dirección' }, { status: 404 });
    if (owner.discordId === me.id) return NextResponse.json({ success: false, error: 'Esa dirección es tuya' }, { status: 400 });

    return NextResponse.json({ success: true, discordId: owner.discordId, displayName: owner.displayName, coinId: owner.coinId });
  } catch (error) {
    console.error('Error resolviendo dirección cripto:', error);
    return NextResponse.json({ success: false, error: 'No se pudo resolver la dirección' }, { status: 500 });
  }
}
