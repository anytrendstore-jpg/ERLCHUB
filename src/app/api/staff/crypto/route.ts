import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { staffIdentity, logStaffAction } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';
import { cryptoCoinsCollection, cryptoWalletsCollection, cryptoTransactionsCollection, ensureCryptoCoinsSeeded } from '@/lib/cryptoServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const denied = await requirePermission('economy.view');
  if (denied) return denied;

  try {
    const coinsCol = await ensureCryptoCoinsSeeded();
    const [coins, wallets, txs] = await Promise.all([
      coinsCol.find({}).sort({ order: 1 }).toArray(),
      (await cryptoWalletsCollection()).find({}).toArray(),
      (await cryptoTransactionsCollection()).find({}).toArray(),
    ]);

    const today = new Date().toISOString().slice(0, 10);
    const coinById = new Map(coins.map((c) => [c.id, c]));
    const circulating: Record<string, number> = {};
    let totalValueCOP = 0;
    for (const w of wallets) {
      for (const [coinId, amount] of Object.entries(w.holdings || {})) {
        circulating[coinId] = (circulating[coinId] || 0) + (amount as number);
        const coin = coinById.get(coinId);
        if (coin) totalValueCOP += (amount as number) * coin.price;
      }
    }

    const stats = {
      usersWithWallet: wallets.length,
      totalVolumeCOP: txs.reduce((sum, t) => sum + t.valueCOP, 0),
      feeRevenueCOP: txs.reduce((sum, t) => sum + t.feeCOP, 0),
      txCountToday: txs.filter((t) => new Date(t.createdAt).toISOString().slice(0, 10) === today).length,
      totalValueCOP,
      totalTransactions: txs.length,
    };

    return NextResponse.json({
      success: true,
      coins: coins.map(({ _id, priceHistory, ...c }: any) => ({ ...c, circulating: circulating[c.id] || 0 })),
      stats,
    });
  } catch (error) {
    console.error('Error leyendo administración de Crypto Economy:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/**
 * action: 'create' | 'update' | 'toggle'
 * create: { symbol, name, icon, price, volatility, minPrice, maxPrice, feePercent, maxSupply? }
 * update: { id, ...campos a cambiar }
 * toggle: { id }
 */
export async function PATCH(request: NextRequest) {
  const denied = await requirePermission('economy.manage');
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    const body = await request.json();
    const col = await cryptoCoinsCollection();

    if (body.action === 'create') {
      const { symbol, name, icon, price, volatility, minPrice, maxPrice, feePercent, maxSupply } = body;
      if (!symbol || !name || !price) return NextResponse.json({ success: false, error: 'Faltan campos' }, { status: 400 });
      const count = await col.countDocuments();
      const now = new Date();
      const doc = {
        id: crypto.randomUUID(), symbol: String(symbol).toUpperCase(), name, icon: icon || '🪙',
        price: Number(price), price24hAgo: Number(price), price24hAgoSetAt: now,
        volatility: Number(volatility) || 0.03, minPrice: Number(minPrice) || Math.round(Number(price) * 0.3),
        maxPrice: Number(maxPrice) || Math.round(Number(price) * 3), feePercent: Number(feePercent) || 1,
        maxSupply: maxSupply ? Number(maxSupply) : undefined,
        enabled: true, order: count, priceHistory: [{ t: now.getTime(), p: Number(price) }], lastTickAt: now,
        createdAt: now, updatedBy: identity?.name || 'Staff',
      };
      await col.insertOne(doc);
      await logStaffAction({
        type: 'crypto_coin_created', category: 'ECONOMIA', actor: identity?.name || 'Staff', actorId: identity?.id, target: symbol,
        description: `${identity?.name || 'Staff'} creó la criptomoneda "${name}" (${symbol})`,
      });
      return NextResponse.json({ success: true, coin: doc });
    }

    if (body.action === 'update') {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });
      const allowed: Record<string, unknown> = {};
      for (const key of ['name', 'icon', 'price', 'volatility', 'minPrice', 'maxPrice', 'feePercent', 'maxSupply'] as const) {
        if (key in updates) allowed[key] = updates[key];
      }
      allowed.updatedBy = identity?.name || 'Staff';
      await col.updateOne({ id }, { $set: allowed });
      await logStaffAction({
        type: 'crypto_coin_updated', category: 'ECONOMIA', actor: identity?.name || 'Staff', actorId: identity?.id, target: id,
        description: `${identity?.name || 'Staff'} actualizó la criptomoneda (${id})`,
      });
      return NextResponse.json({ success: true });
    }

    if (body.action === 'toggle') {
      const { id } = body;
      const coin = await col.findOne({ id });
      if (!coin) return NextResponse.json({ success: false, error: 'Moneda no encontrada' }, { status: 404 });
      await col.updateOne({ id }, { $set: { enabled: !coin.enabled, updatedBy: identity?.name || 'Staff' } });
      await logStaffAction({
        type: 'crypto_coin_updated', category: 'ECONOMIA', actor: identity?.name || 'Staff', actorId: identity?.id, target: coin.symbol,
        description: `${identity?.name || 'Staff'} ${coin.enabled ? 'desactivó' : 'activó'} la criptomoneda "${coin.symbol}"`,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('Error administrando Crypto Economy:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}
