import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { userId, transactionId, amount, referralCode } = await request.json();

    if (!userId || !transactionId || !amount) {
      return NextResponse.json({ 
        success: false, 
        error: 'Datos incompletos para procesar referido' 
      }, { status: 400 });
    }

    if (!referralCode) {
      return NextResponse.json({
        success: true,
        message: 'No hay código de referido para procesar'
      });
    }

    const db = await connectToDatabase();
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/referrals/manage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        action: 'process_referral',
        data: {
          referralCode,
          transactionId,
          amount
        }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Error processing referral:', result.error);
    }

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Referido procesado exitosamente' : 'Error procesando referido',
      referralProcessed: result.success
    });

  } catch (error) {
    console.error('Error en proceso de referido:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}