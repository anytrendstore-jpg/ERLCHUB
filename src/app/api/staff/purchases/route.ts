import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { requireStaff } from '@/lib/staffServer';

export const dynamic = 'force-dynamic';

/** Últimas compras reales (colección `hubcoins_transactions`) para Directivos > Compras. */
export async function GET() {
  const denied = requireStaff();
  if (denied) return denied;

  try {
    const db = await connectToDatabase();
    const purchases = await db
      .collection('hubcoins_transactions')
      .aggregate([
        { $match: { type: 'purchase' } },
        { $sort: { timestamp: -1 } },
        { $limit: 100 },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: 'discordId',
            as: 'user',
          },
        },
      ])
      .toArray();

    const totalRevenue = await db
      .collection('hubcoins_transactions')
      .aggregate([
        { $match: { type: 'purchase', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ])
      .toArray();

    return NextResponse.json({
      success: true,
      purchases: purchases.map((p: any) => ({
        id: p._id?.toString(),
        userId: p.userId,
        username: p.user?.[0]?.global_name || p.user?.[0]?.username || p.userId,
        amount: p.amount,
        description: p.description,
        status: p.status,
        timestamp: p.timestamp,
      })),
      totalHubCoinsSold: totalRevenue[0]?.total || 0,
    });
  } catch (error) {
    console.error('Error listando compras:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
