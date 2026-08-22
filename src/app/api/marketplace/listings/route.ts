import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMarketUser, ensureMarketplaceSeeded, marketplaceListingsCollection, marketplaceFavoritesCollection } from '@/lib/marketplaceServer';
import { notifyUser } from '@/lib/notificationsServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const me = await currentMarketUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const mine = request.nextUrl.searchParams.get('mine') === '1';
    const col = await ensureMarketplaceSeeded();
    const filter: Record<string, unknown> = mine ? { sellerId: me.id } : { status: 'active' };
    const docs = await col.find(filter).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ success: true, listings: docs.map(({ _id, ...l }: any) => l) });
  } catch (error) {
    console.error('Error listando publicaciones de MercadoLibre:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

const MAX_IMAGES = 6;
const MAX_IMAGE_LEN = 700_000; // ~700KB en base64, ya comprimida en el navegador

function sanitizeImages(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images
    .filter((i): i is string => typeof i === 'string' && i.startsWith('data:image/') && i.length <= MAX_IMAGE_LEN)
    .slice(0, MAX_IMAGES);
}

export async function POST(request: NextRequest) {
  const me = await currentMarketUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { name, description, price, category, iconId, stock, images } = await request.json();
    if (!name?.trim() || !Number.isFinite(Number(price)) || Number(price) <= 0) {
      return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
    }

    const col = await marketplaceListingsCollection();
    const now = new Date();
    const doc = {
      id: crypto.randomUUID(),
      sellerId: me.id,
      sellerUsername: me.displayName,
      official: false,
      name: String(name).trim().slice(0, 80),
      description: String(description || '').trim().slice(0, 500),
      price: Number(price),
      iconId: iconId || 'tools',
      images: sanitizeImages(images),
      category: category?.trim() || 'Otros',
      stock: Number(stock) > 0 ? Number(stock) : 1,
      status: 'active' as const,
      rating: 0,
      reviews: 0,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(doc);

    return NextResponse.json({ success: true, listing: doc });
  } catch (error) {
    console.error('Error publicando artículo:', error);
    return NextResponse.json({ success: false, error: 'No se pudo publicar' }, { status: 500 });
  }
}

/** action: 'update' | 'remove' | 'pause' | 'reactivate' */
export async function PATCH(request: NextRequest) {
  const me = await currentMarketUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { listingId, action, name, description, price, stock, images } = await request.json();
    const col = await marketplaceListingsCollection();
    const listing = await col.findOne({ id: listingId });
    if (!listing) return NextResponse.json({ success: false, error: 'No existe' }, { status: 404 });
    if (listing.sellerId !== me.id) return NextResponse.json({ success: false, error: 'No es tuyo' }, { status: 403 });

    if (action === 'remove') {
      await col.updateOne({ id: listingId }, { $set: { status: 'removed', updatedAt: new Date() } });
    } else if (action === 'pause') {
      await col.updateOne({ id: listingId }, { $set: { status: 'paused', updatedAt: new Date() } });
    } else if (action === 'reactivate') {
      await col.updateOne({ id: listingId }, { $set: { status: 'active', updatedAt: new Date() } });
    } else {
      const update: Record<string, unknown> = { updatedAt: new Date() };
      if (name?.trim()) update.name = String(name).trim().slice(0, 80);
      if (typeof description === 'string') update.description = description.trim().slice(0, 500);
      if (Array.isArray(images)) update.images = sanitizeImages(images);
      const newPrice = Number(price);
      const priceDropped = Number.isFinite(newPrice) && newPrice > 0 && newPrice < listing.price;
      if (Number.isFinite(newPrice) && newPrice > 0) update.price = newPrice;
      if (Number.isFinite(Number(stock)) && Number(stock) >= 0) update.stock = Number(stock);
      await col.updateOne({ id: listingId }, { $set: update });

      if (priceDropped) {
        const favCol = await marketplaceFavoritesCollection();
        const favoriters = await favCol.find({ listingId }).toArray();
        await Promise.all(favoriters.map((f) =>
          notifyUser(f.discordId, {
            title: 'Bajó de precio',
            message: `${listing.name} ahora cuesta $${newPrice.toLocaleString('es-CO')}`,
            type: 'info',
            appId: 'mercadolibre',
          })
        ));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error actualizando publicación:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}
