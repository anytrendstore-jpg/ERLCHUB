import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    
    return NextResponse.json({
      success: true,
      message: 'Reviews Simple GET funciona',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en Reviews Simple Debug GET:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error en debug',
      message: (error as any)?.message || 'Error desconocido'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Reviews Simple POST funciona',
      data: body,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en Reviews Simple Debug POST:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error en debug',
      message: (error as any)?.message || 'Error desconocido'
    }, { status: 500 });
  }
}