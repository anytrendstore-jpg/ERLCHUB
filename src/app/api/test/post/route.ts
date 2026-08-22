import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  
  try {
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'POST test successful',
      receivedData: body,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en POST API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error en test POST',
        message: error?.message || 'Error desconocido'
      },
      { status: 500 }
    );
  }
}