import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { requirePermission } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
}

/**
 * Alertas calculadas en vivo (no hay proceso en segundo plano en este
 * proyecto): se evalúan un puñado de reglas simples cada vez que se abre el
 * panel, sobre datos reales. Nada de esto está inventado ni simulado.
 */
export async function GET() {
  const denied = await requirePermission('economy.view');
  if (denied) return denied;

  try {
    const db = await connectToDatabase();
    const alerts: Alert[] = [];

    const holders = await db
      .collection('users')
      .find({ hubCoins: { $gt: 0 } }, { projection: { discordId: 1, username: 1, global_name: 1, hubCoins: 1 } })
      .sort({ hubCoins: -1 })
      .toArray();

    const total = holders.reduce((s, u: any) => s + (u.hubCoins || 0), 0);
    const average = holders.length ? total / holders.length : 0;

    // Regla 1: cuentas con saldo muy por encima de la media (posible farmeo/exploit).
    const threshold = Math.max(average * 5, 5000);
    const outliers = holders.filter((u: any) => (u.hubCoins || 0) > threshold);
    for (const u of outliers.slice(0, 10)) {
      alerts.push({
        id: `outlier-${u.discordId}`,
        severity: 'warning',
        title: 'Saldo muy por encima de la media',
        description: `${u.global_name || u.username} tiene ${u.hubCoins.toLocaleString()} HC (la media es ${Math.round(average).toLocaleString()} HC)`,
      });
    }

    // Regla 2: compras masivas en la última hora (posible bot/abuso de pasarela).
    const recentPurchases = await db.collection('hubcoins_transactions').aggregate([
      { $match: { type: 'purchase', status: 'completed', timestamp: { $gte: new Date(Date.now() - 3600000) } } },
      { $group: { _id: '$userId', count: { $sum: 1 }, total: { $sum: '$amount' } } },
      { $match: { count: { $gte: 4 } } },
    ]).toArray();
    for (const p of recentPurchases) {
      alerts.push({
        id: `burst-${p._id}`,
        severity: 'critical',
        title: 'Compras masivas en la última hora',
        description: `El usuario ${p._id} hizo ${p.count} compras (${p.total.toLocaleString()} HC) en menos de 1 hora`,
      });
    }

    // Regla 3: concentración de riqueza alta (ya calculado en /balance, se repite aquí en compacto).
    const top1 = Math.max(1, Math.ceil(holders.length * 0.01));
    const top1Total = holders.slice(0, top1).reduce((s, u: any) => s + (u.hubCoins || 0), 0);
    const concentration = total > 0 ? (top1Total / total) * 100 : 0;
    if (concentration > 40) {
      alerts.push({
        id: 'concentration',
        severity: 'warning',
        title: 'Alta concentración de riqueza',
        description: `El 1% de las cuentas concentra el ${concentration.toFixed(1)}% de todos los Hub Coins en circulación`,
      });
    }

    return NextResponse.json({ success: true, alerts, checkedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error calculando alertas económicas:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
