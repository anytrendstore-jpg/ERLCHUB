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
    const user = await db.collection('users').findOne({ discordId: userId });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      hubCoins: user.hubCoins || 0
    });
  } catch (error) {
    console.error('Error fetching Hub Coins:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, type, description } = await request.json();

    if (!userId || !amount || !type) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const db = await connectToDatabase();
    const transaction = {
      userId,
      amount,
      type,
      description,
      timestamp: new Date(),
      status: 'completed'
    };

    await db.collection('hubcoins_transactions').insertOne(transaction);

    const updateOperation = type === 'purchase' 
      ? { $inc: { hubCoins: amount } }
      : { $inc: { hubCoins: -amount } };

    await db.collection('users').updateOne(
      { discordId: userId },
      updateOperation
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating Hub Coins:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}