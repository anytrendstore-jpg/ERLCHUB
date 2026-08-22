import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { applications } from '@/lib/whitelistServer';
import { requireStaff, staffReports, staffSanctions, staffTickets } from '@/lib/staffServer';

export const dynamic = 'force-dynamic';

const RANGE_HOURS: Record<string, number> = { '24h': 24, '7d': 24 * 7, '30d': 24 * 30, '90d': 24 * 90 };

export async function GET(request: NextRequest) {
  const denied = requireStaff();
  if (denied) return denied;

  try {
    const rangeParam = request.nextUrl.searchParams.get('range') || '30d';
    const hours = RANGE_HOURS[rangeParam] || RANGE_HOURS['30d'];
    const since = new Date(Date.now() - hours * 3600 * 1000);

    const db = await connectToDatabase();
    const [wl, sanctions, tickets, reports] = await Promise.all([
      applications(),
      staffSanctions(),
      staffTickets(),
      staffReports(),
    ]);

    const [
      whitelistByStatus,
      sanctionsByType,
      ticketsByStatus,
      reportsByStatus,
      totalPlayers,
      totalHubCoins,
      newPlayers,
    ] = await Promise.all([
      wl.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]).toArray(),
      sanctions.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: '$type', count: { $sum: 1 } } }]).toArray(),
      tickets.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]).toArray(),
      reports.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]).toArray(),
      db.collection('users').countDocuments({}),
      db.collection('users').aggregate([{ $group: { _id: null, total: { $sum: { $ifNull: ['$hubCoins', 0] } } } }]).toArray(),
      db.collection('users').countDocuments({ createdAt: { $gte: since } }),
    ]);

    const toMap = (rows: { _id: string; count: number }[]) =>
      rows.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r._id]: r.count }), {});

    return NextResponse.json({
      success: true,
      range: rangeParam,
      totalPlayers,
      newPlayers,
      totalHubCoinsInCirculation: totalHubCoins[0]?.total || 0,
      whitelist: toMap(whitelistByStatus),
      sanctions: toMap(sanctionsByType),
      tickets: toMap(ticketsByStatus),
      reports: toMap(reportsByStatus),
    });
  } catch (error) {
    console.error('Error calculando estadísticas de staff:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
