import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    const db = await connectToDatabase();
    
    const rejectedTransaction = {
      userId,
      amount: 100,
      type: 'purchase',
      description: 'Pago rechazado - tarjeta declinada',
      metadata: { paymentMethod: 'credit_card', errorCode: 'CARD_DECLINED' },
      timestamp: new Date(),
      status: 'rejected'
    };

    await db.collection('hubcoins_transactions').insertOne(rejectedTransaction);
    await db.collection('users').updateOne(
      { discordId: userId },
      { $push: { transactions: rejectedTransaction } }
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Transacción rechazada de prueba guardada',
      transaction: rejectedTransaction
    });
  } catch (error) {
    console.error('Error creating test rejected transaction:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}