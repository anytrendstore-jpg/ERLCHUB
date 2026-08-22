import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  
  try {
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Ultra simple POST funciona',
      data: body,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en Ultra Simple POST:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error en ultra simple',
      message: (error as any)?.message || 'Error desconocido'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  
  try {
    return NextResponse.json({
      success: true,
      message: 'Ultra simple GET funciona',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en Ultra Simple GET:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error en ultra simple',
      message: (error as any)?.message || 'Error desconocido'
    }, { status: 500 });
  }
}