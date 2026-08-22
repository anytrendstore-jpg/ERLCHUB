import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMarketUser, marketplaceReviewsCollection, marketplaceListingsCollection, marketplacePurchasesCollection } from '@/lib/marketplaceServer';
import { notifyUser } from '@/lib/notificationsServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const listingId = request.nextUrl.searchParams.get('listingId');
  if (!listingId) return NextResponse.json({ success: false, error: 'Falta listingId' }, { status: 400 });

  const col = await marketplaceReviewsCollection();
  const docs = await col.find({ listingId }).sort({ createdAt: -1 }).toArray();
  return NextResponse.json({ success: true, reviews: docs.map(({ _id, ...r }: any) => r) });
}

export async function POST(request: NextRequest) {
  const me = await currentMarketUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { listingId, rating, comment } = await request.json();
    const ratingNum = Number(rating);
    if (!listingId || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
    }

    const purchasesCol = await marketplacePurchasesCollection();
    const purchased = await purchasesCol.findOne({ listingId, buyerId: me.id });
    if (!purchased) return NextResponse.json({ success: false, error: 'Solo quienes compraron pueden dejar una reseña' }, { status: 403 });

    const listingsCol = await marketplaceListingsCollection();
    const listing = await listingsCol.findOne({ id: listingId });
    if (!listing) return NextResponse.json({ success: false, error: 'Publicación no encontrada' }, { status: 404 });

    const reviewsCol = await marketplaceReviewsCollection();
    const existing = await reviewsCol.findOne({ listingId, buyerId: me.id });
    if (existing) return NextResponse.json({ success: false, error: 'Ya dejaste una reseña para esto' }, { status: 400 });

    const doc = {
      id: crypto.randomUUID(), listingId, sellerId: listing.sellerId,
      buyerId: me.id, buyerUsername: me.displayName, rating: ratingNum,
      comment: String(comment || '').trim().slice(0, 300), createdAt: new Date(),
    };
    await reviewsCol.insertOne(doc);

    const allReviews = await reviewsCol.find({ listingId }).toArray();
    const avgRating = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await listingsCol.updateOne({ id: listingId }, { $set: { rating: Math.round(avgRating * 10) / 10, reviews: allReviews.length } });

    if (listing.sellerId !== me.id) {
      await notifyUser(listing.sellerId, {
        title: 'Nueva reseña',
        message: `${me.displayName} calificó ${listing.name} con ${ratingNum}★`,
        type: 'info',
        appId: 'mercadolibre',
      });
    }

    return NextResponse.json({ success: true, review: doc });
  } catch (error) {
    console.error('Error creando reseña:', error);
    return NextResponse.json({ success: false, error: 'No se pudo publicar la reseña' }, { status: 500 });
  }
}
