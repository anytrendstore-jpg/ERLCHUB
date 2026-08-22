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
    
    const hubcoinsTransactions = await db.collection('hubcoins_transactions')
      .find({ userId: userId })
      .sort({ timestamp: -1 })
      .toArray();
    
    const user = await db.collection('users').findOne({ discordId: userId });
    const userTransactions = user?.transactions || [];
    
    const allHubcoinsTransactions = await db.collection('hubcoins_transactions')
      .find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    return NextResponse.json({
      success: true,
      userId,
      hubcoinsTransactions: {
        count: hubcoinsTransactions.length,
        data: hubcoinsTransactions
      },
      userTransactions: {
        count: userTransactions.length,
        data: userTransactions
      },
      allHubcoinsTransactions: {
        count: allHubcoinsTransactions.length,
        data: allHubcoinsTransactions
      },
      completedTransactions: hubcoinsTransactions.filter(t => t.status === 'completed').length,
      rejectedTransactions: hubcoinsTransactions.filter(t => t.status === 'rejected' || t.status === 'failed' || t.status === 'cancelled').length
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}