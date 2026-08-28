import { NextRequest, NextResponse } from 'next/server';
import { shopCatalogCollection, type ShopCatalogType } from '@/lib/shopCatalogServer';

export const dynamic = 'force-dynamic';

const VALID_TYPES: ShopCatalogType[] = ['membership', 'kit', 'hub-coins-package', 'item', 'whitelist-fast'];

/** Catálogo público de la tienda (membresías, kits, Hub Coins, artículos, whitelist fast) — sin auth, solo activos. */
export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type') as ShopCatalogType | null;
    const id = request.nextUrl.searchParams.get('id');
    const col = await shopCatalogCollection();

    if (id) {
      const item = await col.findOne({ id, active: true });
      if (!item) return NextResponse.json({ success: false, error: 'No encontrado' }, { status: 404 });
      const { _id, ...rest } = item as any;
      return NextResponse.json({ success: true, item: rest });
    }

    if (type) {
      if (!VALID_TYPES.includes(type)) {
        return NextResponse.json({ success: false, error: 'Tipo inválido' }, { status: 400 });
      }
      const items = await col.find({ type, active: true }).sort({ sortOrder: 1 }).toArray();
      return NextResponse.json({ success: true, items: items.map(({ _id, ...i }: any) => i) });
    }

    const all = await col.find({ active: true }).sort({ type: 1, sortOrder: 1 }).toArray();
    const grouped: Record<string, any[]> = {};
    for (const item of all) {
      const { _id, ...rest } = item as any;
      (grouped[item.type] ||= []).push(rest);
    }
    return NextResponse.json({ success: true, catalog: grouped });
  } catch (error) {
    console.error('Error leyendo el catálogo de tienda:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
