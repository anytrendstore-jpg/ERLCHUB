import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  
  try {
    const mongoUri = process.env.MONGODB_URI;

    const db = await connectToDatabase();
    
    const mongoose = require('mongoose');
    const Review = mongoose.models.Review || mongoose.model('Review', new mongoose.Schema({}, { collection: 'reviews' }));
    
    const count = await Review.countDocuments();
    
    const reviews = await Review.find().limit(1).lean();
    
    return NextResponse.json({
      success: true,
      debug: {
        mongoUriExists: !!mongoUri,
        mongoUriLength: mongoUri?.length || 0,
        nodeEnv: process.env.NODE_ENV,
        dbConnected: !!db,
        totalReviews: count,
        hasReviews: reviews.length > 0,
        sampleReview: reviews[0] || null
      }
    });
    
  } catch (error) {
    console.error('Error en debug reviews:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        mongoUriExists: !!process.env.MONGODB_URI,
        nodeEnv: process.env.NODE_ENV,
        stack: error instanceof Error ? error.stack : null
      }
    }, { status: 500 });
  }
}