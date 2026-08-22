import { NextResponse } from 'next/server';
import { currentMarketUser } from '@/lib/marketplaceServer';
import { economyTaxRates } from '@/lib/staffServer';

export const dynamic = 'force-dynamic';

/** Comisión vigente de MercadoLibre (visible para cualquier usuario logueado, la fija Staff en Impuestos). */
export async function GET() {
  const me = await currentMarketUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await economyTaxRates();
    const doc = await col.findOne({ category: 'marketplace' });
    return NextResponse.json({ success: true, percentage: doc?.percentage ?? 0 });
  } catch (error) {
    console.error('Error leyendo comisión de MercadoLibre:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
