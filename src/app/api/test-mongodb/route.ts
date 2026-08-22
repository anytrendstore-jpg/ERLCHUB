import { NextRequest, NextResponse } from 'next/server';

const MONGODB_URI = process.env.MONGODB_URI;

export async function GET(request: NextRequest) {
  try {
    console.log('=== Test MongoDB Connection ===');
    
    if (!MONGODB_URI) {
      return NextResponse.json({
        success: false,
        error: 'MONGODB_URI no está definida',
        env: process.env.NODE_ENV
      }, { status: 500 });
    }

    console.log('🔗 Intentando conectar a MongoDB...');
    console.log('🔗 URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
    const mongoose = await import('mongoose').then(m => m.default);
    const connection = await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    });
    
    const TestSchema = new mongoose.Schema({
      test: String,
      timestamp: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.models.Test || mongoose.model('Test', TestSchema);
    
    const testDoc = new TestModel({ test: 'connection_test' });
    await testDoc.save();
    await TestModel.deleteOne({ _id: testDoc._id });
    
    await mongoose.disconnect();
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connection test successful',
      details: {
        uri: MONGODB_URI.replace(/\/\/.*@/, '//***:***@'), 
        env: process.env.NODE_ENV,
        database: connection.connection.name,
        host: connection.connection.host,
        port: connection.connection.port
      }
    });
    
  } catch (error) {
    console.error('❌ Error en test de conexión:', error);
    
    return NextResponse.json({
      success: false,
      error: 'MongoDB connection failed',
      message: (error as any)?.message || 'Error desconocido',
      details: (error as any)?.toString(),
      env: process.env.NODE_ENV,
      hasUri: !!MONGODB_URI,
      uriStart: MONGODB_URI?.substring(0, 50) + '...'
    }, { status: 500 });
  }
}