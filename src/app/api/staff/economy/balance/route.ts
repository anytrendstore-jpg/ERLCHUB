import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { requirePermission } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

/**
 * Indicadores de balance económico, calculados en vivo a partir de los saldos
 * reales de Hub Coins. No hay "inflación" en el sentido de precios porque no
 * existe una serie histórica de precios — el indicador real disponible es la
 * concentración de riqueza y el crecimiento del total en circulación.
 */
export async function GET() {
  const denied = await requirePermission('economy.view');
  if (denied) return denied;

  try {
    const db = await connectToDatabase();
    const holders = await db
      .collection('users')
      .find({ hubCoins: { $gt: 0 } }, { projection: { hubCoins: 1 } })
      .sort({ hubCoins: -1 })
      .toArray();

    const total = holders.reduce((sum, u: any) => sum + (u.hubCoins || 0), 0);
    const average = holders.length ? Math.round(total / holders.length) : 0;

    const top1PercentCount = Math.max(1, Math.ceil(holders.length * 0.01));
    const top1PercentTotal = holders.slice(0, top1PercentCount).reduce((s, u: any) => s + (u.hubCoins || 0), 0);
    const concentration = total > 0 ? Math.round((top1PercentTotal / total) * 1000) / 10 : 0;

    const purchases24h = await db.collection('hubcoins_transactions').aggregate([
      { $match: { type: 'purchase', status: 'completed', timestamp: { $gte: new Date(Date.now() - 86400000) } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).toArray();

    // Umbral configurable de "riesgo de concentración": por encima de 40% en
    // el 1% de las cuentas se marca como alerta, es un valor razonable de
    // referencia para economías virtuales pequeñas.
    const concentrationRisk = concentration > 40 ? 'alto' : concentration > 25 ? 'medio' : 'bajo';

    return NextResponse.json({
      success: true,
      totalCirculation: total,
      holders: holders.length,
      averageBalance: average,
      topBalance: holders[0]?.hubCoins || 0,
      concentrationPercent: concentration,
      concentrationRisk,
      hubCoinsIssuedLast24h: purchases24h[0]?.total || 0,
    });
  } catch (error) {
    console.error('Error calculando balance económico:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
