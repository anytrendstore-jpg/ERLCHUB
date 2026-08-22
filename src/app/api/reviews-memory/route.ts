import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

/**
 * Esta ruta usaba su propia conexión con mongoose, en paralelo a la del resto de la app.
 * En esta máquina esa conexión no llegaba a establecerse (fallaba primero la consulta SRV por el
 * DNS local, y aun forzando DNS público mongoose seguía sin poder conectar al cluster), así que la
 * home devolvía 500 tras 10-30s. Se pasó al mismo driver nativo que ya usa todo el proyecto vía
 * `connectToDatabase()` — que sí conecta bien — eliminando además un segundo pool de conexiones.
 * La forma de la respuesta se mantiene idéntica para no tocar `useHomeReviews` / `useReviews`.
 */

const TAGS = ['Comunidad', 'Tienda', 'Hub Coins'] as const;
type ReviewTag = (typeof TAGS)[number];

interface ReviewDoc {
  _id: string;
  name?: string;
  rating: number;
  comment: string;
  tag: ReviewTag;
  userId?: string;
  username?: string;
  avatar?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

async function reviewsCollection() {
  const db = await connectToDatabase();
  return db.collection<ReviewDoc>('reviews');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rating, comment, tag, userId, username, avatar } = body;

    if (!rating || !comment || !tag || !userId) {
      return NextResponse.json({ success: false, error: 'Faltan campos' }, { status: 400 });
    }
    if (!TAGS.includes(tag)) {
      return NextResponse.json({ success: false, error: 'Categoría inválida' }, { status: 400 });
    }

    const now = new Date();
    const doc: ReviewDoc = {
      _id: crypto.randomUUID(),
      rating: Number(rating),
      comment,
      tag,
      userId,
      username: username || 'Usuario Anónimo',
      avatar: avatar || null,
      createdAt: now,
      updatedAt: now,
    };

    const col = await reviewsCollection();
    await col.insertOne(doc);

    return NextResponse.json({ success: true, data: doc });
  } catch (error: any) {
    console.error('Error creando reseña:', error);
    return NextResponse.json({ success: false, error: 'No se pudo guardar la reseña' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50));

    const col = await reviewsCollection();
    const query = tag && tag !== 'Todas' ? { tag: tag as ReviewTag } : {};

    const [reviews, allStats, total] = await Promise.all([
      col.find(query).sort({ createdAt: -1 }).limit(limit).toArray(),
      col.aggregate([{ $group: { _id: '$tag', count: { $sum: 1 }, avg: { $avg: '$rating' } } }]).toArray(),
      col.countDocuments({}),
    ]);

    const statsMap: Record<string, { count: number; avgRating: number }> = {};
    for (const s of allStats) {
      statsMap[s._id as string] = { count: s.count, avgRating: Math.round((s.avg || 0) * 10) / 10 };
    }

    const stats = {
      comunidad: statsMap['Comunidad'] || { count: 0, avgRating: 0 },
      tienda: statsMap['Tienda'] || { count: 0, avgRating: 0 },
      hubCoins: statsMap['Hub Coins'] || { count: 0, avgRating: 0 },
      total,
    };

    return NextResponse.json({ success: true, data: { reviews, stats } });
  } catch (error: any) {
    console.error('Error leyendo reseñas:', error);
    return NextResponse.json({ success: false, error: 'No se pudieron cargar las reseñas' }, { status: 500 });
  }
}
