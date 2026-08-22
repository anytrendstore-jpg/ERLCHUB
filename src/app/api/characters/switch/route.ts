import { NextRequest, NextResponse } from 'next/server';
import { currentDiscordUser } from '@/lib/whitelistServer';
import { charactersCollection, setActiveCharacterCookie, touchCharacterSession } from '@/lib/characterServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = currentDiscordUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id del personaje' }, { status: 400 });

    const col = await charactersCollection();
    const character = await col.findOne({ id, discordId: user.id });
    if (!character) return NextResponse.json({ success: false, error: 'Personaje no encontrado' }, { status: 404 });

    setActiveCharacterCookie(id);
    await touchCharacterSession(id);

    return NextResponse.json({ success: true, character });
  } catch (error) {
    console.error('Error cambiando de personaje:', error);
    return NextResponse.json({ success: false, error: 'No se pudo cambiar de personaje' }, { status: 500 });
  }
}
