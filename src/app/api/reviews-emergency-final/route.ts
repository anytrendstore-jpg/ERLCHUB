import { NextRequest, NextResponse } from 'next/server';

const MONGODB_URI = process.env.MONGODB_URI;

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
    
    const mongoose = await import('mongoose').then(m => m.default);
    
    await mongoose.connect(MONGODB_URI!, {
      serverSelectionTimeoutMS: 10000,
      bufferCommands: false
    });
    
    const ReviewSchema = new mongoose.Schema({
      name: String,
      rating: Number,
      comment: String,
      tag: String,
      userId: String,
      username: String,
      avatar: String
    }, { timestamps: true });
    
    const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
    const reviewData = {
      rating,
      comment,
      tag,
      userId,
      username: username || 'Usuario Anónimo',
      avatar: avatar || null
    };
    
    const review = new Review(reviewData);
    const savedReview = await review.save();
    
    await mongoose.disconnect();
    
    return NextResponse.json({
      success: true,
      data: savedReview.toObject(),
      message: 'Reseña guardada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error en Reviews Emergency POST:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al guardar la reseña',
        message: (error as any)?.message || 'Error desconocido'
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
    const mongoose = await import('mongoose').then(m => m.default);
    
    await mongoose.connect(MONGODB_URI!, {
      serverSelectionTimeoutMS: 10000,
      bufferCommands: false
    });
    
    const ReviewSchema = new mongoose.Schema({
      name: String,
      rating: Number,
      comment: String,
      tag: String,
      userId: String,
      username: String,
      avatar: String
    }, { timestamps: true });
    
    const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
    
    let query = {};
    if (tag && (tag === 'Comunidad' || tag === 'Tienda' || tag === 'Hub Coins')) {
      query = { tag };
    }
    
    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    await mongoose.disconnect();
    
    return NextResponse.json({
      success: true,
      data: {
        reviews: reviews.map(r => r.toObject()),
        stats: { total: reviews.length }
      }
    });
    
  } catch (error) {
    console.error('❌ Error en Reviews Emergency GET:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener reseñas',
        message: (error as any)?.message || 'Error desconocido'
      },
      { status: 500 }
    );
  }
}