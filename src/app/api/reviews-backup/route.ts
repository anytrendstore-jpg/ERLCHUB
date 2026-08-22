import { NextRequest, NextResponse } from 'next/server';

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
    
    const reviewData = {
      rating,
      comment,
      tag,
      userId,
      username: username || 'Usuario Anónimo',
      avatar: avatar || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    try {
      const mongoose = await import('mongoose').catch(() => null);
      if (mongoose) {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) {
          throw new Error('MONGODB_URI no está definida');
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
        const review = new Review(reviewData);
        await review.save();
        
        
        return NextResponse.json({
          success: true,
          data: reviewData,
          message: 'Reseña guardada permanentemente en MongoDB'
        });
      } else {
        throw new Error('No se pudo cargar mongoose');
      }
    } catch (error) {
      console.error('❌ Error guardando en MongoDB Atlas:', error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al guardar la reseña',
          message: (error as any)?.message || 'Error desconocido'
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('❌ Error en Reviews Backup API POST:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al procesar la solicitud',
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
    
    try {
      const mongoose = await import('mongoose').catch(() => null);
      if (mongoose) {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) {
          throw new Error('MONGODB_URI no está definida');
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
        
        let query = {};
        if (tag && (tag === 'Comunidad' || tag === 'Tienda' || tag === 'Hub Coins')) {
          query = { tag };
        }
        
        const reviews = await Review.find(query).sort({ createdAt: -1 }).limit(limit);
        const allReviews = await Review.find({});
        const stats = {
          comunidad: {
            count: allReviews.filter(r => r.tag === 'Comunidad').length,
            avgRating: calculateAvgRating(allReviews.filter(r => r.tag === 'Comunidad'))
          },
          tienda: {
            count: allReviews.filter(r => r.tag === 'Tienda').length,
            avgRating: calculateAvgRating(allReviews.filter(r => r.tag === 'Tienda'))
          },
          hubCoins: {
            count: allReviews.filter(r => r.tag === 'Hub Coins').length,
            avgRating: calculateAvgRating(allReviews.filter(r => r.tag === 'Hub Coins'))
          },
          total: allReviews.length
        };
        
        return NextResponse.json({
          success: true,
          data: {
            reviews: reviews.map(r => r.toObject()),
            stats
          }
        });
      } else {
        throw new Error('No se pudo cargar mongoose');
      }
    } catch (error) {
      console.error('❌ Error obteniendo de MongoDB Atlas:', error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al obtener reseñas',
          message: (error as any)?.message || 'Error desconocido'
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('❌ Error en Reviews Backup API GET:', error);
    
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

function calculateAvgRating(reviews: any[]) {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}