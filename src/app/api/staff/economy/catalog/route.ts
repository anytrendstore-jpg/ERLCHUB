import { NextRequest, NextResponse } from 'next/server';
import {
  shopCatalogCollection,
  upsertCatalogItem,
  deleteCatalogItem,
  type ShopCatalogDoc,
  type ShopCatalogType,
} from '@/lib/shopCatalogServer';
import { logStaffAction, staffIdentity } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

const VALID_TYPES: ShopCatalogType[] = ['membership', 'kit', 'hub-coins-package', 'item', 'whitelist-fast'];

export async function GET(request: NextRequest) {
  const denied = await requirePermission('economy.view');
  if (denied) return denied;

  try {
    const type = request.nextUrl.searchParams.get('type') as ShopCatalogType | null;
    const col = await shopCatalogCollection();
    const query = type ? { type } : {};
    const docs = await col.find(query).sort({ type: 1, sortOrder: 1 }).toArray();
    return NextResponse.json({ success: true, items: docs.map(({ _id, ...i }: any) => i) });
  } catch (error) {
    console.error('Error listando el catálogo de tienda:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** Crea o reemplaza un item completo del catálogo (mismo "id" = upsert). */
export async function POST(request: NextRequest) {
  const denied = await requirePermission('economy.manage');
  if (denied) return denied;

  try {
    const body = await request.json();
    if (!body.id?.trim() || !VALID_TYPES.includes(body.type)) {
      return NextResponse.json({ success: false, error: 'Faltan datos válidos del producto' }, { status: 400 });
    }

    const identity = staffIdentity();
    const doc = { ...body, id: body.id.trim(), active: body.active ?? true } as Omit<ShopCatalogDoc, 'createdAt' | 'updatedAt'>;
    const saved = await upsertCatalogItem(doc, identity?.name || 'Director');

    await logStaffAction({
      type: 'economy_item_created',
      category: 'ECONOMIA',
      actor: identity?.name || 'Director',
      actorId: identity?.id,
      target: (saved as any).name || saved.id,
      description: `${identity?.name || 'Director'} guardó "${(saved as any).name || saved.id}" en el catálogo de tienda (${saved.type})`,
    });

    return NextResponse.json({ success: true, item: saved });
  } catch (error) {
    console.error('Error guardando item del catálogo:', error);
    return NextResponse.json({ success: false, error: 'No se pudo guardar el producto' }, { status: 500 });
  }
}

/** action: 'update' (mismo shape que POST) | 'toggle' (activar/desactivar). */
export async function PATCH(request: NextRequest) {
  const denied = await requirePermission('economy.manage');
  if (denied) return denied;

  try {
    const body = await request.json();
    if (!body.id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await shopCatalogCollection();
    const existing = await col.findOne({ id: body.id });
    if (!existing) return NextResponse.json({ success: false, error: 'Producto no encontrado' }, { status: 404 });

    const identity = staffIdentity();

    if (body.action === 'toggle') {
      const saved = await upsertCatalogItem({ ...existing, active: !existing.active } as any, identity?.name || 'Director');
      await logStaffAction({
        type: 'economy_item_updated', category: 'ECONOMIA', actor: identity?.name || 'Director', actorId: identity?.id,
        target: (existing as any).name || existing.id,
        description: `${identity?.name || 'Director'} ${saved.active ? 'activó' : 'desactivó'} "${(existing as any).name || existing.id}" en el catálogo de tienda`,
      });
      return NextResponse.json({ success: true, item: saved });
    }

    const saved = await upsertCatalogItem({ ...existing, ...body } as any, identity?.name || 'Director');
    await logStaffAction({
      type: 'economy_item_updated', category: 'ECONOMIA', actor: identity?.name || 'Director', actorId: identity?.id,
      target: (saved as any).name || saved.id,
      description: `${identity?.name || 'Director'} actualizó "${(saved as any).name || saved.id}" en el catálogo de tienda`,
    });
    return NextResponse.json({ success: true, item: saved });
  } catch (error) {
    console.error('Error actualizando item del catálogo:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await requirePermission('economy.manage');
  if (denied) return denied;

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await shopCatalogCollection();
    const existing = await col.findOne({ id });
    await deleteCatalogItem(id);

    if (existing) {
      const identity = staffIdentity();
      await logStaffAction({
        type: 'economy_item_deleted', category: 'ECONOMIA', actor: identity?.name || 'Director', actorId: identity?.id,
        target: (existing as any).name || existing.id,
        description: `${identity?.name || 'Director'} eliminó "${(existing as any).name || existing.id}" del catálogo de tienda`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando item del catálogo:', error);
    return NextResponse.json({ success: false, error: 'No se pudo eliminar' }, { status: 500 });
  }
}
