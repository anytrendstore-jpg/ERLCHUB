import { NextRequest, NextResponse } from 'next/server';
import { staffIdentity, logStaffAction } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';
import { listCharacters, getCharacterSlots, accountMetaCollection } from '@/lib/characterServer';

export const dynamic = 'force-dynamic';

/** Personajes y slots de una cuenta — para que un Director los revise/ajuste desde el expediente del jugador. */
export async function GET(request: NextRequest) {
  const denied = await requirePermission('players.economy.view');
  if (denied) return denied;

  const discordId = request.nextUrl.searchParams.get('discordId');
  if (!discordId) return NextResponse.json({ success: false, error: 'Falta el discordId' }, { status: 400 });

  try {
    const [characters, slots] = await Promise.all([listCharacters(discordId), getCharacterSlots(discordId)]);
    return NextResponse.json({ success: true, characters, slots });
  } catch (error) {
    console.error('Error leyendo personajes del jugador:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await requirePermission('players.economy.edit');
  if (denied) return denied;

  try {
    const { discordId, slots } = await request.json();
    if (!discordId || !Number.isFinite(slots) || slots < 1) {
      return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
    }

    const col = await accountMetaCollection();
    await col.updateOne(
      { discordId },
      { $set: { characterSlots: Math.floor(slots), updatedAt: new Date() } },
      { upsert: true }
    );

    const staff = staffIdentity();
    await logStaffAction({
      type: 'character_slots_updated',
      category: 'ECONOMIA',
      actor: staff?.name || 'Staff',
      actorId: staff?.id,
      target: discordId,
      targetId: discordId,
      description: `Slots de personaje ajustados a ${Math.floor(slots)}`,
    });

    return NextResponse.json({ success: true, slots: Math.floor(slots) });
  } catch (error) {
    console.error('Error actualizando slots de personaje:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}
