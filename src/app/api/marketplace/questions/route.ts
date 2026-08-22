import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMarketUser, marketplaceQuestionsCollection, marketplaceListingsCollection } from '@/lib/marketplaceServer';
import { notifyUser } from '@/lib/notificationsServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const listingId = request.nextUrl.searchParams.get('listingId');
  if (!listingId) return NextResponse.json({ success: false, error: 'Falta listingId' }, { status: 400 });

  const col = await marketplaceQuestionsCollection();
  const docs = await col.find({ listingId }).sort({ createdAt: -1 }).toArray();
  return NextResponse.json({ success: true, questions: docs.map(({ _id, ...q }: any) => q) });
}

export async function POST(request: NextRequest) {
  const me = await currentMarketUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { listingId, question } = await request.json();
    const trimmed = String(question || '').trim();
    if (!listingId || !trimmed) return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });

    const listingsCol = await marketplaceListingsCollection();
    const listing = await listingsCol.findOne({ id: listingId });
    if (!listing) return NextResponse.json({ success: false, error: 'Publicación no encontrada' }, { status: 404 });

    const doc = {
      id: crypto.randomUUID(), listingId, sellerId: listing.sellerId,
      askerId: me.id, askerUsername: me.displayName, question: trimmed.slice(0, 300), createdAt: new Date(),
    };
    const col = await marketplaceQuestionsCollection();
    await col.insertOne(doc);

    if (listing.sellerId !== me.id) {
      await notifyUser(listing.sellerId, {
        title: 'Nueva pregunta',
        message: `${me.displayName} preguntó sobre ${listing.name}`,
        type: 'info',
        appId: 'mercadolibre',
      });
    }

    return NextResponse.json({ success: true, question: doc });
  } catch (error) {
    console.error('Error creando pregunta:', error);
    return NextResponse.json({ success: false, error: 'No se pudo publicar la pregunta' }, { status: 500 });
  }
}

/** Solo el vendedor puede responder. */
export async function PATCH(request: NextRequest) {
  const me = await currentMarketUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { questionId, answer } = await request.json();
    const trimmed = String(answer || '').trim();
    if (!questionId || !trimmed) return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });

    const col = await marketplaceQuestionsCollection();
    const q = await col.findOne({ id: questionId });
    if (!q) return NextResponse.json({ success: false, error: 'No encontrada' }, { status: 404 });
    if (q.sellerId !== me.id) return NextResponse.json({ success: false, error: 'Solo el vendedor puede responder' }, { status: 403 });

    await col.updateOne({ id: questionId }, { $set: { answer: trimmed.slice(0, 300), answeredAt: new Date() } });

    const listingsCol = await marketplaceListingsCollection();
    const listing = await listingsCol.findOne({ id: q.listingId });
    if (q.askerId !== me.id) {
      await notifyUser(q.askerId, {
        title: 'Respondieron tu pregunta',
        message: `${listing?.name || 'Un vendedor'} respondió: "${trimmed.slice(0, 80)}"`,
        type: 'info',
        appId: 'mercadolibre',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error respondiendo pregunta:', error);
    return NextResponse.json({ success: false, error: 'No se pudo responder' }, { status: 500 });
  }
}
