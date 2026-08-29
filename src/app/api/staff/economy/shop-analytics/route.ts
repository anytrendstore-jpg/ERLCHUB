import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { shopOrdersCollection } from '@/lib/shopOrdersServer';
import { storeEventsCollection } from '@/lib/storeEventsServer';
import { requirePermission } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function startOfWeek(d: Date) { const x = startOfDay(d); const day = x.getDay() || 7; x.setDate(x.getDate() - day + 1); return x; }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function startOfYear(d: Date) { return new Date(d.getFullYear(), 0, 1); }

/**
 * Analíticas de ventas 100% reales — derivadas de shop_orders (Fase C), membership_subscriptions
 * y hubcoins_transactions (kits, que se pagan con Hub Coins y no pasan por shop_orders). Nada de
 * tracking de visitantes/funnels/dispositivos/geografía/fraude — eso no existe en este sitio hoy
 * y no se fabrica acá (ver plan Fase C, sección "explícitamente fuera de esta fase").
 */
export async function GET(request: NextRequest) {
  const denied = await requirePermission('economy.view');
  if (denied) return denied;

  try {
    const db = await connectToDatabase();
    const ordersCol = await shopOrdersCollection();
    const now = new Date();

    const completedOrders = await ordersCol.find({ status: 'completed' }).sort({ completedAt: -1 }).toArray();

    const revenueBetween = (from: Date, to: Date) => completedOrders.filter((o) => {
      const d = o.completedAt || o.updatedAt;
      return d >= from && d < to;
    }).reduce((s, o) => s + o.amountUSD, 0);
    const revenueSince = (since: Date) => completedOrders.filter((o) => (o.completedAt || o.updatedAt) >= since).reduce((s, o) => s + o.amountUSD, 0);
    const grossRevenue = completedOrders.reduce((s, o) => s + o.amountUSD, 0);
    const revenueToday = revenueSince(startOfDay(now));
    const revenueWeek = revenueSince(startOfWeek(now));
    const revenueMonth = revenueSince(startOfMonth(now));
    const revenueYear = revenueSince(startOfYear(now));

    // Comparación contra el período anterior — mismo criterio para todas las órdenes reales
    // (Hub Coins, membresías y whitelist fast; los kits no pasan por acá, ver comentario de arriba).
    const startThisMonth = startOfMonth(now);
    const startLastMonth = new Date(startThisMonth.getFullYear(), startThisMonth.getMonth() - 1, 1);
    const revenuePrevMonth = revenueBetween(startLastMonth, startThisMonth);
    const revenueGrowthPct = revenuePrevMonth > 0 ? Math.round(((revenueMonth - revenuePrevMonth) / revenuePrevMonth) * 1000) / 10 : null;

    const ordersByStatus = { total: completedOrders.length + 0, completed: completedOrders.length, pending: 0, failed: 0 };
    const allOrders = await ordersCol.find({}).toArray();
    ordersByStatus.total = allOrders.length;
    ordersByStatus.pending = allOrders.filter((o) => o.status === 'pending' || o.status === 'delivering').length;
    ordersByStatus.failed = allOrders.filter((o) => o.status === 'failed').length;

    // Motivos reales de fallo (no hay sistema de reembolsos en el sitio — no se fabrica uno acá).
    const failedByReason = new Map<string, number>();
    for (const o of allOrders) {
      if (o.status !== 'failed') continue;
      const reason = o.failReason || 'desconocido';
      failedByReason.set(reason, (failedByReason.get(reason) || 0) + 1);
    }

    // Método de pago real (Wompi lo manda en el webhook — ver deliverMembership/handleApprovedPayment).
    const paymentMethods = new Map<string, { count: number; revenue: number }>();
    for (const o of completedOrders) {
      const method = o.paymentMethodType || 'Sin registrar';
      const entry = paymentMethods.get(method) || { count: 0, revenue: 0 };
      entry.count += 1;
      entry.revenue += o.amountUSD;
      paymentMethods.set(method, entry);
    }

    // LTV real por cliente — gasto histórico total, no una proyección.
    const spendByCustomer = new Map<string, number>();
    for (const o of completedOrders) spendByCustomer.set(o.discordId, (spendByCustomer.get(o.discordId) || 0) + o.amountUSD);
    const ltvValues = Array.from(spendByCustomer.values());
    const avgLtv = ltvValues.length > 0 ? ltvValues.reduce((a, b) => a + b, 0) / ltvValues.length : 0;
    const topCustomerIds = Array.from(spendByCustomer.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const topCustomerUsers = topCustomerIds.length > 0
      ? await db.collection('users').find({ discordId: { $in: topCustomerIds.map(([id]) => id) } }).toArray()
      : [];
    const topCustomers = topCustomerIds.map(([discordId, totalSpent]) => ({
      discordId,
      username: topCustomerUsers.find((u: any) => u.discordId === discordId)?.username || discordId,
      totalSpent: Math.round(totalSpent * 100) / 100,
      orders: completedOrders.filter((o) => o.discordId === discordId).length,
    }));

    const aov = completedOrders.length > 0 ? grossRevenue / completedOrders.length : 0;

    // Hub Coins vendidos con dinero real (paquetes, dentro de shop_orders) — desglose por paquete.
    const hcSalesByPackage = new Map<string, { catalogId: string; name: string; sold: number; revenue: number }>();
    let hcSoldTotal = 0;
    for (const order of completedOrders) {
      for (const item of order.items) {
        if (item.type !== 'hub-coins-package') continue;
        hcSoldTotal += item.quantity;
        const entry = hcSalesByPackage.get(item.catalogId) || { catalogId: item.catalogId, name: item.name, sold: 0, revenue: 0 };
        entry.sold += item.quantity;
        entry.revenue += item.unitPriceUSD * item.quantity;
        hcSalesByPackage.set(item.catalogId, entry);
      }
    }

    // Clientes nuevos vs recurrentes (últimos 30 días) — primera orden completada de cada discordId.
    const firstOrderByCustomer = new Map<string, Date>();
    for (const order of [...completedOrders].sort((a, b) => (a.completedAt?.getTime() || 0) - (b.completedAt?.getTime() || 0))) {
      if (!firstOrderByCustomer.has(order.discordId)) firstOrderByCustomer.set(order.discordId, order.completedAt || order.updatedAt);
    }
    const since30 = new Date(now.getTime() - 30 * 86400000);
    const customersInWindow = new Set(completedOrders.filter((o) => (o.completedAt || o.updatedAt) >= since30).map((o) => o.discordId));
    let newCustomers = 0, returningCustomers = 0;
    for (const discordId of Array.from(customersInWindow)) {
      const first = firstOrderByCustomer.get(discordId);
      if (first && first >= since30) newCustomers++; else returningCustomers++;
    }

    // Membresías: activas + MRR (solo mensuales activas cuentan) + churn simple (canceladas/expiradas / activas al inicio del período).
    const subs = await db.collection('membership_subscriptions').find({}).toArray();
    const activeSubs = subs.filter((s: any) => s.status === 'active');
    const mrr = activeSubs.filter((s: any) => s.membershipType === 'monthly').reduce((sum: number, s: any) => sum + (s.renewalPrice || 0), 0);
    const cancelledOrExpiredLast30 = subs.filter((s: any) => (s.status === 'cancelled' || s.status === 'expired') && s.endDate && new Date(s.endDate) >= since30).length;
    const churnRate = activeSubs.length > 0 ? Math.round((cancelledOrExpiredLast30 / (activeSubs.length + cancelledOrExpiredLast30)) * 1000) / 10 : 0;
    const byMembership = new Map<string, number>();
    for (const s of activeSubs) byMembership.set(s.membershipId, (byMembership.get(s.membershipId) || 0) + 1);
    const mostPopularMembership = Array.from(byMembership.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Kits: se pagan con Hub Coins ya en balance, no generan shop_orders — se leen de hubcoins_transactions.
    const kitTx = await db.collection('hubcoins_transactions').find({ type: 'purchase', 'metadata.kitIds': { $exists: true } }).toArray();
    const kitsSold = kitTx.reduce((s: number, t: any) => s + (t.metadata?.kitIds?.length || 0), 0);
    const kitsHubCoinsSpent = kitTx.reduce((s: number, t: any) => s + (t.amount || 0), 0);
    const uniqueKitBuyers = new Set(kitTx.map((t: any) => t.userId)).size;

    // Serie diaria (últimos 30 días) para el gráfico: ingresos reales (USD) y Hub Coins vendidos (paquetes).
    const days: { key: string; label: string; revenue: number; hcSold: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      days.push({ key: startOfDay(d).toDateString(), label: d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }), revenue: 0, hcSold: 0 });
    }
    for (const order of completedOrders) {
      const key = startOfDay(order.completedAt || order.updatedAt).toDateString();
      const bucket = days.find((d) => d.key === key);
      if (!bucket) continue;
      bucket.revenue += order.amountUSD;
      bucket.hcSold += order.items.filter((i) => i.type === 'hub-coins-package').reduce((s, i) => s + i.quantity, 0);
    }

    // Funnel del sitio (últimos 30 días) — page_view -> select_package -> checkout_start, y la
    // "compra" final sale de shop_orders (completadas) que traen trackingSessionId, no de un
    // evento de "compra" separado que podría desincronizarse de lo que el webhook confirmó.
    const eventsCol = await storeEventsCollection();
    const recentEvents = await eventsCol.find({ timestamp: { $gte: since30 } }).toArray();
    const pageViews = recentEvents.filter((e) => e.type === 'page_view');
    const selectPackage = recentEvents.filter((e) => e.type === 'select_package');
    const checkoutStart = recentEvents.filter((e) => e.type === 'checkout_start');
    const purchasesWithSession = completedOrders.filter(
      (o) => o.trackingSessionId && (o.completedAt || o.updatedAt) >= since30
    );
    const visitors = new Set(pageViews.map((e) => e.sessionId)).size;

    const devices = { desktop: 0, mobile: 0, tablet: 0 };
    for (const e of pageViews) devices[e.device]++;

    const trafficSources = { direct: 0, discord: 0, search: 0, social: 0, referral: 0 };
    for (const e of pageViews) if (e.trafficSource) trafficSources[e.trafficSource]++;

    const funnel = {
      pageViews: pageViews.length,
      selectPackage: selectPackage.length,
      checkoutStart: checkoutStart.length,
      purchases: purchasesWithSession.length,
      conversionRate: pageViews.length > 0 ? Math.round((purchasesWithSession.length / pageViews.length) * 1000) / 10 : 0,
    };

    // Economía de Hub Coins — 100% real, derivada de hubcoins_transactions y del saldo actual de
    // cada usuario. "Sinks" = en qué se gastan, agrupado por el campo `type` que ya usa cada ruta
    // que descuenta HC (kits, casino, marketplace, etc.) — no hay categorías inventadas acá.
    const allHcTx = await db.collection('hubcoins_transactions').find({}).toArray();
    const totalIssued = allHcTx.filter((t: any) => t.amount > 0).reduce((s: number, t: any) => s + t.amount, 0);
    const totalSpent = allHcTx.filter((t: any) => t.amount < 0).reduce((s: number, t: any) => s + Math.abs(t.amount), 0);
    const sinksByType = new Map<string, number>();
    for (const t of allHcTx) {
      if (t.amount >= 0) continue;
      sinksByType.set(t.type || 'otro', (sinksByType.get(t.type || 'otro') || 0) + Math.abs(t.amount));
    }
    const topHoldersRaw = await db.collection('users').find({ hubCoins: { $gt: 0 } }).sort({ hubCoins: -1 }).limit(10).toArray();
    const circulating = (await db.collection('users').aggregate([{ $group: { _id: null, total: { $sum: '$hubCoins' } } }]).toArray())[0]?.total || 0;

    return NextResponse.json({
      success: true,
      revenue: {
        gross: grossRevenue, today: revenueToday, week: revenueWeek, month: revenueMonth, year: revenueYear,
        prevMonth: revenuePrevMonth, growthPct: revenueGrowthPct,
      },
      orders: ordersByStatus,
      failedReasons: Array.from(failedByReason.entries()).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count),
      paymentMethods: Array.from(paymentMethods.entries()).map(([method, v]) => ({ method, ...v })).sort((a, b) => b.revenue - a.revenue),
      ltv: { average: Math.round(avgLtv * 100) / 100, topCustomers },
      aov: Math.round(aov * 100) / 100,
      hubCoins: { totalSold: hcSoldTotal, byPackage: Array.from(hcSalesByPackage.values()).sort((a, b) => b.revenue - a.revenue) },
      customers: { new: newCustomers, returning: returningCustomers },
      memberships: { active: activeSubs.length, mrr: Math.round(mrr * 100) / 100, churnRatePct: churnRate, mostPopular: mostPopularMembership },
      kits: { sold: kitsSold, hubCoinsSpent: kitsHubCoinsSpent, uniqueBuyers: uniqueKitBuyers },
      series: days,
      visitors,
      devices,
      trafficSources,
      funnel,
      hubCoinsEconomy: {
        totalIssued,
        totalSpent,
        circulating,
        sinks: Array.from(sinksByType.entries()).map(([type, amount]) => ({ type, amount })).sort((a, b) => b.amount - a.amount),
        topHolders: topHoldersRaw.map((u: any) => ({ discordId: u.discordId, username: u.username || u.discordId, avatar: u.avatar, hubCoins: u.hubCoins })),
      },
    });
  } catch (error) {
    console.error('Error calculando analíticas de tienda:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
