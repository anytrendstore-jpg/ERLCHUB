import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    const db = await connectToDatabase();
    const transactions = await db.collection('hubcoins_transactions')
      .aggregate([
        { $match: { userId: userId } },
        { $sort: { timestamp: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: 'discordId',
            as: 'userInfo'
          }
        },
        {
          $unwind: '$userInfo'
        }
      ])
      .toArray();

    return NextResponse.json({
      success: true,
      transactions: transactions.map(t => ({
        ...t,
        user: {
          username: t.userInfo.global_name || t.userInfo.username,
          avatar: t.userInfo.avatar
        }
      }))
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, type, description, metadata, status = 'completed' } = await request.json();

    if (!userId || !amount || !type) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const db = await connectToDatabase();
    const transaction = {
      userId,
      amount,
      type, 
      description,
      metadata: metadata || {},
      timestamp: new Date(),
      status 
    };

    await db.collection('hubcoins_transactions').insertOne(transaction);
    if (status === 'completed') {
      const updateOperation = type === 'purchase' 
        ? { $inc: { hubCoins: amount } }
        : { $inc: { hubCoins: -amount } };

      const result = await db.collection('users').updateOne(
        { discordId: userId },
        updateOperation
      );
    }

    await db.collection('users').updateOne(
      { discordId: userId },
      { $push: { transactions: transaction } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const updatedUser = await db.collection('users').findOne({ discordId: userId });

    return NextResponse.json({ 
      success: true, 
      newBalance: updatedUser?.hubCoins || 0,
      transaction
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}