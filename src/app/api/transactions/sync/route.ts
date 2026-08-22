import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { userId, forceSync = false } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    const db = await connectToDatabase();
    const hubcoinsTransactions = await db.collection('hubcoins_transactions')
      .find({ userId: userId })
      .sort({ timestamp: -1 })
      .toArray();

    const user = await db.collection('users').findOne({ discordId: userId });
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (forceSync || !user.transactions || user.transactions.length === 0) {
      await db.collection('users').updateOne(
        { discordId: userId },
        { 
          $set: { 
            transactions: hubcoinsTransactions,
            lastSyncDate: new Date()
          }
        }
      );
    }

    const completedTransactions = hubcoinsTransactions.filter(t => t.status === 'completed');
    const rejectedTransactions = hubcoinsTransactions.filter(t => 
      t.status === 'rejected' || t.status === 'failed' || t.status === 'cancelled'
    );

    const stats = {
      total: hubcoinsTransactions.length,
      completed: completedTransactions.length,
      rejected: rejectedTransactions.length,
      recentActivity: hubcoinsTransactions.slice(0, 10)
    };

    return NextResponse.json({
      success: true,
      message: 'Transactions synchronized successfully',
      stats,
      transactions: hubcoinsTransactions
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    const db = await connectToDatabase();
    const user = await db.collection('users').findOne({ discordId: userId });
    const hubcoinsTransactions = await db.collection('hubcoins_transactions')
      .find({ userId: userId })
      .sort({ timestamp: -1 })
      .toArray();

    const syncStatus = {
      hasUserTransactions: user && user.transactions && user.transactions.length > 0,
      userTransactionsCount: user?.transactions?.length || 0,
      hubcoinsTransactionsCount: hubcoinsTransactions.length,
      lastSyncDate: user?.lastSyncDate,
      needsSync: !user?.lastSyncDate || 
        (new Date().getTime() - new Date(user.lastSyncDate).getTime() > 5 * 60 * 1000) // 5 minutes
    };

    return NextResponse.json({
      success: true,
      syncStatus,
      transactions: hubcoinsTransactions
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}