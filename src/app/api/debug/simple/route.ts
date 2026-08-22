import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  
  try {
    const mongoUri = process.env.MONGODB_URI;
    const nodeEnv = process.env.NODE_ENV;
    
    const mongoose = require('mongoose');
    
    const testSchema = new mongoose.Schema({ test: String });
    
    return NextResponse.json({
      success: true,
      data: {
        mongoUriExists: !!mongoUri,
        mongoUriLength: mongoUri?.length || 0,
        nodeEnv,
        mongooseLoaded: !!mongoose,
        schemaCreated: !!testSchema,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error en Simple Debug API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error en simple debug',
        message: error?.message || 'Error desconocido',
        stack: error?.stack || null
      },
      { status: 500 }
    );
  }
}