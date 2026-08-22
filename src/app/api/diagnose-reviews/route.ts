import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI: process.env.MONGODB_URI ? 'DEFINIDA' : 'NO DEFINIDA',
      MONGODB_URI_LENGTH: process.env.MONGODB_URI?.length || 0,
      MONGODB_URI_START: process.env.MONGODB_URI?.substring(0, 20) + '...'
    };
    let mongooseStatus = 'NO IMPORTADO';
    try {
      const mongoose = await import('mongoose').then(m => m.default);
      mongooseStatus = 'IMPORTADO EXITOSAMENTE';
    } catch (error) {
      mongooseStatus = `ERROR: ${(error as any).message}`;
      console.error('❌ Error importando mongoose:', error);
    }
    
    let connectionStatus = 'NO INTENTADA';
    if (process.env.MONGODB_URI) {
      try {
        const mongoose = await import('mongoose').then(m => m.default);
        await mongoose.connect(process.env.MONGODB_URI, {
          serverSelectionTimeoutMS: 3000,
          bufferCommands: false
        });
        await mongoose.disconnect();
        connectionStatus = 'EXITOSA';
      } catch (error) {
        connectionStatus = `ERROR: ${(error as any).message}`;
        console.error('❌ Error conexión MongoDB:', error);
      }
    }
    
    return NextResponse.json({
      success: true,
      diagnosis: {
        timestamp: new Date().toISOString(),
        environment: env,
        mongoose: mongooseStatus,
        connection: connectionStatus,
        recommendations: []
      }
    });
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error en diagnóstico',
      message: (error as any)?.message || 'Error desconocido',
      stack: (error as any)?.stack
    }, { status: 500 });
  }
}