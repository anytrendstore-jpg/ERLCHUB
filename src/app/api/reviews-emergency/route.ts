import { NextRequest, NextResponse } from 'next/server';

let tempReviews: any[] = [];

export async function POST(request: NextRequest) {
  
  try {
    const body = await request.json();
    
    const { rating, comment, tag, userId, username, avatar } = body;
    
    if (!rating || !comment || !tag || !userId) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    
    const tempReview = {
      _id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      rating,
      comment,
      tag,
      userId,
      username: username || 'Usuario Anónimo',
      avatar: avatar || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isTemp: true
    };
    
    tempReviews.push(tempReview);
    
    saveToMongoDB(tempReview).catch(error => {
      console.error('Error guardando en MongoDB background:', error);
    });
    
    return NextResponse.json({
      success: true,
      data: tempReview,
      message: 'Reseña creada exitosamente (temporal)'
    });
    
  } catch (error) {
    console.error('❌ Error en Emergency Reviews API POST:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al procesar la solicitud',
        message: error?.message || 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const limit = parseInt(searchParams.get('limit') || '10');

    let filteredReviews = tempReviews;
    if (tag && (tag === 'Comunidad' || tag === 'Tienda' || tag === 'Hub Coins')) {
      filteredReviews = tempReviews.filter(review => review.tag === tag);
    }
    
    const sortedReviews = filteredReviews.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const limitedReviews = sortedReviews.slice(0, limit);
    const stats = {
      comunidad: {
        count: tempReviews.filter(r => r.tag === 'Comunidad').length,
        avgRating: calculateAvgRating(tempReviews.filter(r => r.tag === 'Comunidad'))
      },
      tienda: {
        count: tempReviews.filter(r => r.tag === 'Tienda').length,
        avgRating: calculateAvgRating(tempReviews.filter(r => r.tag === 'Tienda'))
      },
      hubCoins: {
        count: tempReviews.filter(r => r.tag === 'Hub Coins').length,
        avgRating: calculateAvgRating(tempReviews.filter(r => r.tag === 'Hub Coins'))
      },
      total: tempReviews.length
    };
    
    return NextResponse.json({
      success: true,
      data: {
        reviews: limitedReviews,
        stats
      }
    });
    
  } catch (error) {
    console.error('❌ Error en Emergency Reviews API GET:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener reseñas',
        message: error?.message || 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

function calculateAvgRating(reviews: any[]) {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

async function saveToMongoDB(review: any) {
  try {
    const mongoose = await import('mongoose').catch(() => null);
    if (!mongoose) {
      return;
    }
    
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      return;
    }
    
    if (mongoose.default.connection.readyState !== 1) {
      await mongoose.default.connect(MONGODB_URI);
    }
    
    const ReviewSchema = new mongoose.default.Schema({
      name: { type: String, required: false },
      rating: { type: Number, required: true, min: 1, max: 5 },
      comment: { type: String, required: true },
      tag: { type: String, required: true, enum: ['Comunidad', 'Tienda', 'Hub Coins'] },
      userId: { type: String, required: false },
      username: { type: String, required: false },
      avatar: { type: String, required: false }
    }, { timestamps: true });
    
    const Review = mongoose.default.models.Review || mongoose.default.model('Review', ReviewSchema);
    const mongoReview = new Review({
      rating: review.rating,
      comment: review.comment,
      tag: review.tag,
      userId: review.userId,
      username: review.username,
      avatar: review.avatar
    });
    
    await mongoReview.save();
    
    tempReviews = tempReviews.filter(r => r._id !== review._id);
    
  } catch (error) {
    console.error('Error en saveToMongoDB:', error);
  }
}