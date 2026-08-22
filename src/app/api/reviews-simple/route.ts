import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const REVIEWS_FILE = join(process.cwd(), 'reviews-backup.json');

function loadReviews() {
  try {
    
    if (existsSync(REVIEWS_FILE)) {
      const data = readFileSync(REVIEWS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return parsed;
    } else {
      console.log('❌ El archivo no existe, retornando array vacío');
    }
  } catch (error) {
    console.error('❌ Error loading reviews:', error);
  }
  return [];
}

function saveReviews(reviews: any[]) {
  try {
    
    writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
    
    const verify = readFileSync(REVIEWS_FILE, 'utf8');
    const parsed = JSON.parse(verify);
  } catch (error) {
    console.error('❌ Error saving reviews:', error);
  }
}

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
    
    const newReview = {
      _id: Date.now().toString(),
      rating,
      comment,
      tag,
      userId,
      username: username || 'Usuario Anónimo',
      avatar: avatar || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const reviews = loadReviews();
    
    reviews.unshift(newReview);
    
    saveReviews(reviews);
    
    
    return NextResponse.json({
      success: true,
      data: newReview,
      message: 'Reseña guardada permanentemente en archivo'
    });
    
  } catch (error) {
    console.error('❌ Error en Reviews Simple POST:', error);
    
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
    
    let reviews = loadReviews();
    
    if (tag && tag !== 'Todas') {
      reviews = reviews.filter((r: any) => r.tag === tag);
    }
    const limitedReviews = reviews.slice(0, limit);
    const allReviews = loadReviews();
    const stats = {
      comunidad: {
        count: allReviews.filter((r: any) => r.tag === 'Comunidad').length,
        avgRating: calculateAvgRating(allReviews.filter((r: any) => r.tag === 'Comunidad'))
      },
      tienda: {
        count: allReviews.filter((r: any) => r.tag === 'Tienda').length,
        avgRating: calculateAvgRating(allReviews.filter((r: any) => r.tag === 'Tienda'))
      },
      hubCoins: {
        count: allReviews.filter((r: any) => r.tag === 'Hub Coins').length,
        avgRating: calculateAvgRating(allReviews.filter((r: any) => r.tag === 'Hub Coins'))
      },
      total: allReviews.length
    };
    
    return NextResponse.json({
      success: true,
      data: {
        reviews: limitedReviews,
        stats
      }
    });
    
  } catch (error) {
    console.error('❌ Error en Reviews Simple GET:', error);
    
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