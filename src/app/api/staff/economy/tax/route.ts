import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import {
  economyTaxRates,
  logStaffAction,
  staffIdentity,
  TAX_CATEGORIES,
  type EconomyTaxRate,
} from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

/** Tasas actuales + recaudación estimada de "tienda" a partir de compras reales. */
export async function GET() {
  const denied = await requirePermission('economy.view');
  if (denied) return denied;

  try {
    const col = await economyTaxRates();
    const docs = await col.find({}).toArray();
    const byCategory = docs.reduce<Record<string, number>>((acc, d) => ({ ...acc, [d.category]: d.percentage }), {});

    const rates = TAX_CATEGORIES.map((c) => ({
      category: c.id,
      label: c.label,
      percentage: byCategory[c.id] ?? 0,
    }));

    // Único dato con volumen real detrás: las compras de Hub Coins/artículos.
    const db = await connectToDatabase();
    const totalPurchases = await db
      .collection('hubcoins_transactions')
      .aggregate([{ $match: { type: 'purchase', status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
      .toArray();
    const storeVolume = totalPurchases[0]?.total || 0;
    const storeTaxRate = byCategory['tienda'] ?? 0;

    return NextResponse.json({
      success: true,
      rates,
      estimate: {
        storeVolume,
        storeTaxRate,
        estimatedStoreTax: Math.round(storeVolume * (storeTaxRate / 100)),
      },
    });
  } catch (error) {
    console.error('Error leyendo impuestos:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requirePermission('economy.manage');
  if (denied) return denied;

  try {
    const { category, percentage } = await request.json();
    const valid = TAX_CATEGORIES.some((c) => c.id === category);
    const pct = Number(percentage);
    if (!valid || Number.isNaN(pct) || pct < 0 || pct > 100) {
      return NextResponse.json({ success: false, error: 'Categoría o porcentaje no válido' }, { status: 400 });
    }

    const identity = staffIdentity();
    const col = await economyTaxRates();
    const doc: EconomyTaxRate = {
      category,
      percentage: pct,
      updatedAt: new Date(),
      updatedBy: identity?.name || 'Director',
    };
    await col.updateOne({ category }, { $set: doc }, { upsert: true });

    const label = TAX_CATEGORIES.find((c) => c.id === category)?.label || category;
    await logStaffAction({
      type: 'economy_tax_updated',
      category: 'ECONOMIA',
      actor: doc.updatedBy,
      actorId: identity?.id,
      description: `${doc.updatedBy} fijó el impuesto de "${label}" en ${pct}%`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error actualizando impuesto:', error);
    return NextResponse.json({ success: false, error: 'No se pudo guardar' }, { status: 500 });
  }
}
