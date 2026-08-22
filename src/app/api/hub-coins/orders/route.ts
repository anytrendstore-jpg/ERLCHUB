import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    const db = await connectToDatabase();
    
    const orders = await db.collection('hubcoins_transactions')
      .find({ 
        userId: userId, 
        type: 'purchase'
      })
      .sort({ timestamp: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      totalOrders: orders.length,
      orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}