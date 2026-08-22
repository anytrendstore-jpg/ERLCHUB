import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { userId, createBackup = false } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    const db = await connectToDatabase();
    const hubcoinsTransactions = await db.collection('hubcoins_transactions')
      .find({ userId: userId })
      .sort({ timestamp: -1 })
      .toArray();

    if (createBackup) {
      const backupData = {
        userId,
        backupDate: new Date(),
        transactions: hubcoinsTransactions,
        stats: {
          total: hubcoinsTransactions.length,
          completed: hubcoinsTransactions.filter(t => t.status === 'completed').length,
          rejected: hubcoinsTransactions.filter(t => 
            t.status === 'rejected' || t.status === 'failed' || t.status === 'cancelled'
          ).length
        }
      };

      await db.collection('transactions_backup').insertOne(backupData);
      
      return NextResponse.json({
        success: true,
        message: 'Backup created successfully',
        backupId: backupData._id,
        stats: backupData.stats
      });
    }

    const stats = {
      total: hubcoinsTransactions.length,
      completed: hubcoinsTransactions.filter(t => t.status === 'completed').length,
      rejected: hubcoinsTransactions.filter(t => 
        t.status === 'rejected' || t.status === 'failed' || t.status === 'cancelled'
      ).length,
      recentActivity: hubcoinsTransactions.slice(0, 10)
    };

    return NextResponse.json({
      success: true,
      message: 'Transactions retrieved successfully',
      stats,
      transactions: hubcoinsTransactions
    });

  } catch (error) {
    console.error('Backup error:', error);
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
    const showBackups = searchParams.get('showBackups') === 'true';

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    const db = await connectToDatabase();
    
    if (showBackups) {
      const backups = await db.collection('transactions_backup')
        .find({ userId: userId })
        .sort({ backupDate: -1 })
        .toArray();

      return NextResponse.json({
        success: true,
        backups: backups.map(b => ({
          backupId: b._id,
          backupDate: b.backupDate,
          stats: b.stats,
          transactionCount: b.transactions.length
        }))
      });
    } else {
      const hubcoinsTransactions = await db.collection('hubcoins_transactions')
        .find({ userId: userId })
        .sort({ timestamp: -1 })
        .toArray();

      const stats = {
        total: hubcoinsTransactions.length,
        completed: hubcoinsTransactions.filter(t => t.status === 'completed').length,
        rejected: hubcoinsTransactions.filter(t => 
          t.status === 'rejected' || t.status === 'failed' || t.status === 'cancelled'
        ).length,
        oldestTransaction: hubcoinsTransactions.length > 0 ? hubcoinsTransactions[hubcoinsTransactions.length - 1].timestamp : null,
        newestTransaction: hubcoinsTransactions.length > 0 ? hubcoinsTransactions[0].timestamp : null
      };

      return NextResponse.json({
        success: true,
        stats,
        recentActivity: hubcoinsTransactions.slice(0, 10)
      });
    }

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}