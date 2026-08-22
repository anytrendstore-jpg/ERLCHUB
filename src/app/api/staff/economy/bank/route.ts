import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { requirePermission } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

/**
 * Maze Bank: el libro mayor real del servidor. Reutiliza `hubcoins_transactions`
 * (la única fuente de movimientos de dinero que existe hoy) con filtros
 * avanzados de auditoría.
 */
export async function GET(request: NextRequest) {
  const denied = await requirePermission('economy.view');
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId')?.trim();
    const minAmount = searchParams.get('minAmount');

    const db = await connectToDatabase();
    const query: Record<string, unknown> = {};
    if (type && type !== 'all') query.type = type;
    if (status && status !== 'all') query.status = status;
    if (userId) query.userId = userId;
    if (minAmount) query.amount = { $gte: Number(minAmount) };

    const [transactions, totalCirculation, holders, byType] = await Promise.all([
      db.collection('hubcoins_transactions').find(query).sort({ timestamp: -1 }).limit(200).toArray(),
      db.collection('users').aggregate([{ $group: { _id: null, total: { $sum: { $ifNull: ['$hubCoins', 0] } } } }]).toArray(),
      db.collection('users').countDocuments({ hubCoins: { $gt: 0 } }),
      db.collection('hubcoins_transactions').aggregate([{ $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }]).toArray(),
    ]);

    return NextResponse.json({
      success: true,
      transactions: transactions.map((t: any) => ({
        id: t._id?.toString(), userId: t.userId, amount: t.amount, type: t.type,
        description: t.description, status: t.status, timestamp: t.timestamp,
      })),
      totalCirculation: totalCirculation[0]?.total || 0,
      holders,
      byType: byType.map((t: any) => ({ type: t._id, total: t.total, count: t.count })),
    });
  } catch (error) {
    console.error('Error leyendo Maze Bank:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
