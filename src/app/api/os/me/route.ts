import { NextResponse } from 'next/server';
import { currentDiscordUser } from '@/lib/whitelistServer';
import { usersCollection } from '@/lib/hubPayServer';

export const dynamic = 'force-dynamic';

/**
 * Datos reales de la cuenta (colección `users`) que no viajan en la cookie de sesión de Discord:
 * fecha de registro real y última conexión. Cada carga del escritorio cuenta como una conexión real.
 */
export async function GET() {
  const user = currentDiscordUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await usersCollection();
    const now = new Date();
    const existing = await col.findOne({ discordId: user.id });

    await col.updateOne(
      { discordId: user.id },
      { $set: { lastLogin: now }, $setOnInsert: { discordId: user.id, createdAt: now } },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      createdAt: existing?.createdAt || now,
      lastLogin: existing?.lastLogin || now,
    });
  } catch (error) {
    console.error('Error leyendo datos de cuenta:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
