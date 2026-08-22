import { NextRequest, NextResponse } from 'next/server';
import { currentMarketUser, marketplaceFavoritesCollection } from '@/lib/marketplaceServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentMarketUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await marketplaceFavoritesCollection();
    const docs = await col.find({ discordId: me.id }).toArray();
    return NextResponse.json({ success: true, listingIds: docs.map((d) => d.listingId) });
  } catch (error) {
    console.error('Error listando favoritos:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** Toggle */
export async function POST(request: NextRequest) {
  const me = await currentMarketUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { listingId } = await request.json();
    const col = await marketplaceFavoritesCollection();
    const existing = await col.findOne({ discordId: me.id, listingId });

    if (existing) {
      await col.deleteOne({ discordId: me.id, listingId });
      return NextResponse.json({ success: true, favorited: false });
    }
    await col.insertOne({ discordId: me.id, listingId, createdAt: new Date() });
    return NextResponse.json({ success: true, favorited: true });
  } catch (error) {
    console.error('Error actualizando favorito:', error);
    return NextResponse.json({ success: false, error: 'No se pudo procesar' }, { status: 500 });
  }
}
