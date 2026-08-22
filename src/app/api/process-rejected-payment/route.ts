import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { userId, items, totalHubCoins, reason, errorCode } = await request.json();

    if (!userId || !totalHubCoins) {
      return NextResponse.json({ success: false, error: 'Datos incompletos' }, { status: 400 });
    }

    const db = await connectToDatabase(); 
    const user = await db.collection('users').findOne({ discordId: userId });
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    const rejectedTransaction = {
      type: 'purchase',
      amount: -totalHubCoins, 
      description: reason || `Pago rechazado: ${items?.map((item: any) => item.name).join(', ') || 'Compra'}`,
      timestamp: new Date().toISOString(),
      status: 'rejected',
      metadata: {
        errorCode: errorCode || 'PAYMENT_REJECTED',
        items: items || [],
        originalAmount: totalHubCoins
      }
    };

    await db.collection('users').updateOne(
      { discordId: userId },
      { $push: { transactions: rejectedTransaction } }
    );

    await db.collection('hubcoins_transactions').insertOne({
      userId,
      ...rejectedTransaction
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Pago rechazado procesado correctamente',
      transaction: rejectedTransaction
    });
  } catch (error) {
    console.error('Error procesando pago rechazado:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}