import { NextResponse } from 'next/server';
import { currentBankUser } from '@/lib/hubPayServer';
import { economyTaxRates, TAX_CATEGORIES } from '@/lib/staffServer';

export const dynamic = 'force-dynamic';

/** Tasas de impuestos vigentes (las fija Staff en el panel de Impuestos), visibles para cualquier usuario logueado. */
export async function GET() {
  const me = await currentBankUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await economyTaxRates();
    const docs = await col.find({}).toArray();
    const byCategory = new Map(docs.map((d) => [d.category, d.percentage]));
    const rates = TAX_CATEGORIES.map((c) => ({ category: c.id, label: c.label, percentage: byCategory.get(c.id) ?? 0 }));
    return NextResponse.json({ success: true, rates });
  } catch (error) {
    console.error('Error leyendo tasas de impuestos:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
