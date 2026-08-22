import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getConnection() {
  try {
    const mongoose = await import('mongoose').catch(() => null);
    if (!mongoose) throw new Error('No se pudo cargar mongoose');
    
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) throw new Error('MONGODB_URI no está definida en las variables de entorno de Vercel');
    
    if (mongoose.default.connection.readyState !== 1) {
      await mongoose.default.connect(MONGODB_URI);
    }
    
    return mongoose.default.connection;
  } catch (error) {
    console.error('Error en getConnection:', error);
    throw error;
  }
}

async function getReviewModel() {
  try {
    const mongoose = await import('mongoose').catch(() => null);
    if (!mongoose) throw new Error('No se pudo cargar mongoose');
    
    const ReviewSchema = new mongoose.default.Schema({
      name: { type: String, required: false, trim: true, maxlength: 100 },
      rating: { type: Number, required: true, min: 1, max: 5 },
      comment: { type: String, required: true, trim: true, maxlength: 1000 },
      tag: { type: String, required: true, enum: ['Comunidad', 'Tienda', 'Hub Coins'] },
      userId: { type: String, required: false },
      username: { type: String, required: false, trim: true },
      avatar: { type: String, required: false }
    }, { timestamps: true });
    
    return mongoose.default.models.Review || mongoose.default.model('Review', ReviewSchema);
  } catch (error) {
    console.error('Error en getReviewModel:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    await getConnection();
    const Review = await getReviewModel();
    
    let query = {};
    if (tag && tag !== 'Todas') {
      query = { tag };
    }
    
    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
    
    const allStats = await Review.aggregate([
      {
        $group: {
          _id: "$tag",
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" }
        }
      }
    ]);

    const statsMap = allStats.reduce((acc, curr) => {
      acc[curr._id] = { count: curr.count, avgRating: curr.avgRating || 0 };
      return acc;
    }, {});

    const stats = {
      comunidad: statsMap['Comunidad'] || { count: 0, avgRating: 0 },
      tienda: statsMap['Tienda'] || { count: 0, avgRating: 0 },
      hubCoins: statsMap['Hub Coins'] || { count: 0, avgRating: 0 },
      total: await Review.countDocuments({})
    };
    
    return NextResponse.json({
      success: true,
      data: { reviews, stats }
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
    
  } catch (error) {
    console.error('❌ Error real en GET:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido de conexión'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rating, comment, tag, userId, username, avatar } = body;
    
    if (!rating || !comment || !tag || !userId) {
      return NextResponse.json({ success: false, error: 'Faltan campos requeridos' }, { status: 400 });
    }
    
    await getConnection();
    const Review = await getReviewModel();
    
    const newReview = new Review({
      rating,
      comment,
      tag,
      userId,
      username: username || 'Usuario Anónimo',
      avatar: avatar || null
    });
    
    const savedReview = await newReview.save();
    
    return NextResponse.json({
      success: true,
      data: savedReview
    });
    
  } catch (error) {
    console.error('❌ Error real en POST:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error al guardar reseña'
    }, { status: 500 });
  }
}