import { NextRequest, NextResponse } from 'next/server';
import { osUserPreferencesCollection, currentOSUserId, ensurePreferencesDoc } from '@/lib/osServer';
import type { OSUserPreferences } from '@/lib/osTypes';

export const dynamic = 'force-dynamic';

export async function GET() {
  const discordId = await currentOSUserId();
  if (!discordId) {
    return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });
  }

  try {
    const doc = await ensurePreferencesDoc(discordId);
    const { _id, ...preferences } = doc as any;
    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    console.error('Error leyendo preferencias del OS:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const discordId = await currentOSUserId();
  if (!discordId) {
    return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const col = await osUserPreferencesCollection();
    const existing = await col.findOne({ discordId });

    if (!existing) {
      const doc: OSUserPreferences = {
        discordId,
        ...DEFAULT_OS_PREFERENCES,
        ...(body.wallpaper ? { wallpaper: body.wallpaper } : {}),
        ...(body.theme ? { theme: body.theme } : {}),
        updatedAt: new Date(),
      };
      await col.insertOne(doc);
    } else {
      const update: Record<string, unknown> = { updatedAt: new Date() };
      if (body.wallpaper) update.wallpaper = body.wallpaper;
      if (body.theme) update.theme = body.theme;
      await col.updateOne({ discordId }, { $set: update });
    }

    const fresh = await col.findOne({ discordId });
    const { _id, ...preferences } = fresh as any;
    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    console.error('Error guardando preferencias del OS:', error);
    return NextResponse.json({ success: false, error: 'No se pudo guardar' }, { status: 500 });
  }
}
