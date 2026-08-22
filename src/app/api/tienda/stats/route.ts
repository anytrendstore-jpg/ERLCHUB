import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    
    const totalTransactions = await db.collection('users').aggregate([
      { $unwind: '$transactions' },
      { 
        $match: { 
          'transactions.type': 'purchase',
          'transactions.status': 'completed'
        } 
      },
      { $count: 'total' }
    ]).toArray();

    const hubCoinsOrders = await db.collection('users').aggregate([
      { $unwind: '$transactions' },
      { 
        $match: { 
          'transactions.type': 'purchase',
          'transactions.status': 'completed',
          'transactions.description': { $regex: /kit|hub coins/i }
        } 
      },
      { $count: 'total' }
    ]).toArray();

    const membershipOrders = await db.collection('users').aggregate([
      { $unwind: '$transactions' },
      { 
        $match: { 
          'transactions.type': 'purchase',
          'transactions.status': 'completed',
          'transactions.description': { $regex: /membresía|membership/i }
        } 
      },
      { $count: 'total' }
    ]).toArray();

    const whitelistOrders = await db.collection('users').aggregate([
      { $unwind: '$transactions' },
      { 
        $match: { 
          'transactions.type': 'purchase',
          'transactions.status': 'completed',
          'transactions.description': { $regex: /whitelist/i }
        } 
      },
      { $count: 'total' }
    ]).toArray();

    const activeUsers = await db.collection('users').countDocuments({
      'transactions.0': { $exists: true }
    });

    const totalOrders = totalTransactions[0]?.total || 0;
    const hubCoinsTotal = hubCoinsOrders[0]?.total || 0;
    const membershipTotal = membershipOrders[0]?.total || 0;
    const whitelistTotal = whitelistOrders[0]?.total || 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalOrders,
        hubCoinsOrders: hubCoinsTotal,
        membershipOrders: membershipTotal,
        whitelistOrders: whitelistTotal,
        activeUsers,
        breakdown: {
          hubCoins: hubCoinsTotal,
          memberships: membershipTotal,
          whitelist: whitelistTotal
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de tienda:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error obteniendo estadísticas' 
    }, { status: 500 });
  }
}