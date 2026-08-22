import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { osUserPreferencesCollection, currentOSUserId, DEFAULT_OS_PREFERENCES } from '@/lib/osServer';
import type { OSUserPreferences } from '@/lib/osTypes';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const discordId = await currentOSUserId();
  if (!discordId) {
    return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });
  }

  try {
    const { name, theme, wallpaper } = await request.json();
    if (!name?.trim() || !theme || !wallpaper) {
      return NextResponse.json({ success: false, error: 'Faltan datos del tema' }, { status: 400 });
    }

    const col = await osUserPreferencesCollection();
    const existing = await col.findOne({ discordId });
    const savedTheme = { id: crypto.randomUUID(), name: name.trim(), theme, wallpaper };

    if (!existing) {
      const doc: OSUserPreferences = {
        discordId,
        ...DEFAULT_OS_PREFERENCES,
        savedThemes: [savedTheme],
        updatedAt: new Date(),
      };
      await col.insertOne(doc);
    } else {
      await col.updateOne(
        { discordId },
        { $push: { savedThemes: savedTheme }, $set: { updatedAt: new Date() } }
      );
    }

    return NextResponse.json({ success: true, theme: savedTheme });
  } catch (error) {
    console.error('Error guardando tema personalizado:', error);
    return NextResponse.json({ success: false, error: 'No se pudo guardar el tema' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const discordId = await currentOSUserId();
  if (!discordId) {
    return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await osUserPreferencesCollection();
    await col.updateOne(
      { discordId },
      { $pull: { savedThemes: { id } }, $set: { updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando tema personalizado:', error);
    return NextResponse.json({ success: false, error: 'No se pudo eliminar' }, { status: 500 });
  }
}
