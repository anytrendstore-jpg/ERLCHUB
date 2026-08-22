import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('=== Debug POST Reviews API ===');
  
  try {
    const body = await request.json();
    
    const mongoUri = process.env.MONGODB_URI;
    
    const { connectToDatabase } = require('@/lib/mongodb');
  
    const connection = await connectToDatabase();
    
    const Review = require('@/models/Review').default;
    
    const newReview = new Review({
      rating: body.rating,
      comment: body.comment,
      tag: body.tag,
      userId: body.userId,
      username: body.username || 'Usuario Anónimo',
      avatar: body.avatar || null,
      createdAt: new Date()
    });
    
    const validationError = newReview.validateSync();
    
    return NextResponse.json({
      success: true,
      message: 'Debug POST successful',
      debug: {
        bodyReceived: body,
        mongoUriExists: !!mongoUri,
        mongoUriLength: mongoUri?.length || 0,
        connectToDatabaseImported: !!connectToDatabase,
        connectionSuccess: !!connection,
        reviewModelImported: !!Review,
        reviewInstanceCreated: !!newReview,
        validationError: !!validationError,
        validationDetails: validationError ? Object.keys(validationError.errors) : null,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error en Debug POST Reviews API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error en debug POST reviews',
        message: error?.message || 'Error desconocido',
        stack: error?.stack || null,
        name: error?.name || null
      },
      { status: 500 }
    );
  }
}