import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { initUserServerData } from '@/scripts/init-user-server-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'ID de usuario requerido' }, { status: 400 });
    }

    const db = await connectToDatabase();
    
    let user;
    try {
      user = await db.collection('users').findOne({ discordId: userId });
    } catch (dbError) {
      user = {
        discordId: userId,
        hubCoins: 0,
        transactions: [],
        serverJoins: null,
        currentCity: null,
        membership: null,
        createdAt: new Date('2024-01-15').toISOString()
      };
    }
    
    if (!user) {
      user = {
        discordId: userId,
        hubCoins: 0,
        transactions: [],
        serverJoins: null,
        currentCity: null,
        membership: null,
        createdAt: new Date('2024-01-15').toISOString()
      };
    }

    let allTransactions = [];
    try {
      allTransactions = await db.collection('hubcoins_transactions')
        .find({ userId: userId })
        .sort({ timestamp: -1 })
        .toArray();
      
      const user = await db.collection('users').findOne({ discordId: userId });
      const lastSyncDate = user?.lastSyncDate;
      const needsSync = !lastSyncDate || 
        (new Date().getTime() - new Date(lastSyncDate).getTime() > 5 * 60 * 1000); // 5 minutos
      
      if (needsSync || allTransactions.length === 0) {

        const userTransactions = user?.transactions || [];
        const combinedTransactions = [...allTransactions, ...userTransactions];
        const uniqueTransactions = combinedTransactions.reduce((acc: any, current: any) => {
          const existing = acc.find((t: any) => 
            t.timestamp === current.timestamp && t.description === current.description
          );
          if (!existing) {
            acc.push(current);
          }
          return acc;
        }, []);
        
        allTransactions = uniqueTransactions.sort((a: any, b: any) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        await db.collection('users').updateOne(
          { discordId: userId },
          { 
            $set: { 
              transactions: allTransactions,
              lastSyncDate: new Date()
            }
          }
        );
      }
      
    } catch (transError) {
      console.error('Error buscando transacciones:', transError);
      allTransactions = [];
    }
    
    let hubCoinsTransactions = [];
    let moneyTransactions = [];
    let completedTransactions = [];
    let rejectedTransactions = [];
    
    try {
      hubCoinsTransactions = allTransactions.filter((t: any) => 
        t && t.type === 'purchase' && t.description && t.description.toLowerCase().includes('hub coins')
      );
      
      moneyTransactions = allTransactions.filter((t: any) => 
        t && t.type === 'purchase' && t.description && !t.description.toLowerCase().includes('hub coins')
      );
      
      completedTransactions = allTransactions.filter((t: any) => t && t.status === 'completed');
      rejectedTransactions = allTransactions.filter((t: any) => t && (t.status === 'rejected' || t.status === 'failed' || t.status === 'cancelled'));
    } catch (filterError) {
      console.error('Error filtrando transacciones:', filterError);
    }

    let totalSpent = 0;
    let totalHubCoinsPurchased = 0;
    let totalOrders = allTransactions.length || 0;
    
    try {
      totalSpent = moneyTransactions.reduce((sum: any, t: any) => sum + (t && t.amount > 0 ? t.amount : 0), 0);
      totalHubCoinsPurchased = hubCoinsTransactions.reduce((sum: any, t: any) => sum + (t && t.amount > 0 ? t.amount : 0), 0);
    } catch (calcError) {
    }

    let recentActivity = [];
    try {
      recentActivity = allTransactions
        .filter((t: any) => t && t.timestamp) 
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
        .map((t: any) => ({
          type: t.type || 'unknown',
          amount: t.amount || 0,
          description: t.description || 'Sin descripción',
          status: t.status || 'unknown', 
          timestamp: t.timestamp,
          isHubCoins: t.description && t.description.toLowerCase().includes('hub coins')
        }));
    } catch (activityError) {
      recentActivity = [];
    }

    let userServerData = await db.collection('userServerData').findOne({ discordId: userId });

    if (!userServerData) {
      const testData = {
        discordId: userId,
        serverJoins: {
          erlchub: { serverName: 'ERLCHub', joinedAt: new Date(), isActive: true },
          losSantos: { serverName: 'Los Santos', joinedAt: new Date(), isActive: true }
        },
        currentCity: { name: 'Los Santos', joinedAt: new Date() },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.collection('userServerData').insertOne(testData);
      userServerData = testData;
    }

    const serverJoins = {
      erlchub: userServerData?.serverJoins?.erlchub?.joinedAt?.toISOString() || null,
      losSantos: userServerData?.serverJoins?.losSantos?.joinedAt?.toISOString() || null
    };

    const displayCity = userServerData?.currentCity ? {
      id: userServerData.currentCity.id,
      name: userServerData.currentCity.name
    } : null;

    const profileData = {
      hubCoinsBalance: user.hubCoins || 0,
      totalHubCoinsPurchased,
      totalSpent,
      totalOrders,
      completedOrders: completedTransactions.length,
      rejectedOrders: rejectedTransactions.length,
      recentActivity,
      allTransactions: allTransactions.map((t: any) => ({
        id: t._id || Math.random().toString(),
        type: t.type || 'unknown',
        amount: t.amount || 0,
        description: t.description || 'Sin descripción',
        status: t.status || 'unknown',
        timestamp: t.timestamp,
        isHubCoins: t.description && t.description.toLowerCase().includes('hub coins')
      })),
      serverJoins,
      currentCity: displayCity,
      membership: user.membership || null
    };

    return NextResponse.json({
      success: true,
      profileData
    });

  } catch (error) {
    return NextResponse.json({
      success: true,
      profileData: {
        hubCoinsBalance: 0,
        totalHubCoinsPurchased: 0,
        totalSpent: 0,
        totalOrders: 0,
        completedOrders: 0,
        rejectedOrders: 0,
        recentActivity: [],
        allTransactions: [],
        serverJoins: {
          erlchub: null,
          losSantos: null
        },
        currentCity: null,
        membership: null
      }
    });
  }
}