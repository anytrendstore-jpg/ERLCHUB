import { NextRequest, NextResponse } from 'next/server';

declare global {
  var reviewsMemory: any[] | undefined;
}

export async function GET(request: NextRequest) {
  
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6'); 

    const allReviews = global.reviewsMemory || [];

    let comunidadReviews = allReviews.filter((review: any) => review.tag === 'Comunidad');
    let tiendaReviews = allReviews.filter((review: any) => review.tag === 'Tienda');
    let hubCoinsReviews = allReviews.filter((review: any) => review.tag === 'Hub Coins');
    
    const bestReviews = comunidadReviews.filter((review: any) => review.rating >= 4);
    
    bestReviews.sort((a: any, b: any) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating; 
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    const limitedReviews = bestReviews.slice(0, limit);
    const comunidadStats = {
      count: comunidadReviews.length,
      avgRating: calculateAvgRating(comunidadReviews)
    };
    const tiendaStats = {
      count: tiendaReviews.length,
      avgRating: calculateAvgRating(tiendaReviews)
    };
    const hubCoinsStats = {
      count: hubCoinsReviews.length,
      avgRating: calculateAvgRating(hubCoinsReviews)
    };
    
    return NextResponse.json({
      success: true,
      data: {
        reviews: limitedReviews,
        stats: {
          comunidad: comunidadStats,
          tienda: tiendaStats,
          hubCoins: hubCoinsStats,
          total: allReviews.length
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error en Reviews Home GET:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener reseñas del home',
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