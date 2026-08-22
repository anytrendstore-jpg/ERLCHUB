import { NextResponse } from 'next/server';
import { currentMarketUser, marketplacePurchasesCollection } from '@/lib/marketplaceServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentMarketUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await marketplacePurchasesCollection();
    const [purchases, sales] = await Promise.all([
      col.find({ buyerId: me.id }).sort({ createdAt: -1 }).limit(50).toArray(),
      col.find({ sellerId: me.id }).sort({ createdAt: -1 }).limit(50).toArray(),
    ]);
    return NextResponse.json({
      success: true,
      purchases: purchases.map(({ _id, ...p }: any) => p),
      sales: sales.map(({ _id, ...s }: any) => s),
    });
  } catch (error) {
    console.error('Error leyendo historial de MercadoLibre:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
