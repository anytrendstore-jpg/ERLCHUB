import { NextRequest, NextResponse } from 'next/server';

const MONGODB_URI = process.env.MONGODB_URI;

export async function POST(request: NextRequest) {
  console.log('=== MongoDB Connection Test POST ===');
  
  try {
    const body = await request.json();
    
    const envCheck = {
      MONGODB_URI: MONGODB_URI ? 'DEFINIDA' : 'NO DEFINIDA',
      MONGODB_URI_LENGTH: MONGODB_URI?.length || 0,
      NODE_ENV: process.env.NODE_ENV
    };
    
    
    if (!MONGODB_URI) {
      return NextResponse.json({
        success: false,
        error: 'MONGODB_URI no definida',
        env: envCheck
      }, { status: 500 });
    }
    
    let mongooseStatus = 'NO IMPORTADO';
    try {
      const mongoose = await import('mongoose').then(m => m.default);
      mongooseStatus = 'IMPORTADO CORRECTAMENTE';
    } catch (error) {
      mongooseStatus = `ERROR: ${(error as any).message}`;
      console.error('❌ Error importando mongoose:', error);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test de conexión MongoDB',
      env: envCheck,
      mongoose: mongooseStatus,
      body: body
    });
    
  } catch (error) {
    console.error('❌ Error en MongoDB Connection Test POST:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error en test de conexión',
      message: (error as any)?.message || 'Error desconocido'
    }, { status: 500 });
  }
}