import { NextRequest, NextResponse } from 'next/server';
import { currentDiscordUser, verifiedRobloxAvatar } from '@/lib/whitelistServer';
import { listCharacters, ensurePrimaryCharacter, createCharacter, getCharacterSlots, currentActiveCharacterId } from '@/lib/characterServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = currentDiscordUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    await ensurePrimaryCharacter(user.id, user.global_name || user.username, user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128` : undefined);
    const [characters, slots, activeId, robloxAvatar] = await Promise.all([
      listCharacters(user.id),
      getCharacterSlots(user.id),
      currentActiveCharacterId(),
      verifiedRobloxAvatar(user.id),
    ]);
    // La foto de perfil del escritorio es la del Roblox verificado del jugador, no la de Discord,
    // en cuanto vincula uno en la whitelist — misma cuenta, misma cara real para todos sus personajes.
    const withAvatar = robloxAvatar ? characters.map((c) => ({ ...c, avatar: robloxAvatar })) : characters;
    return NextResponse.json({ success: true, characters: withAvatar, slots, activeCharacterId: activeId });
  } catch (error) {
    console.error('Error listando personajes:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = currentDiscordUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { name, avatar, city } = await request.json();
    const result = await createCharacter(user.id, String(name || ''), { avatar, city });
    if (result.error) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, character: result.character });
  } catch (error) {
    console.error('Error creando personaje:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear el personaje' }, { status: 500 });
  }
}
