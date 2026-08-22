import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { requireStaff } from '@/lib/staffServer';

export const dynamic = 'force-dynamic';

/** Resumen del sistema de referidos, para Directivos > Referidos. */
export async function GET() {
  const denied = requireStaff();
  if (denied) return denied;

  try {
    const db = await connectToDatabase();
    const [totalCodes, totalReferrals, topReferrers, recent] = await Promise.all([
      db.collection('referral_codes').countDocuments({}),
      db.collection('referrals').countDocuments({ status: 'completed' }),
      db
        .collection('referrals')
        .aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: '$userId', count: { $sum: 1 }, coins: { $sum: '$commissionAmount' } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ])
        .toArray(),
      db.collection('referrals').find({}).sort({ createdAt: -1 }).limit(20).toArray(),
    ]);

    return NextResponse.json({
      success: true,
      totalCodes,
      totalReferrals,
      topReferrers: topReferrers.map((r: any) => ({ userId: r._id, count: r.count, coins: r.coins })),
      recent: recent.map(({ _id, ...r }: any) => r),
    });
  } catch (error) {
    console.error('Error calculando referidos:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
