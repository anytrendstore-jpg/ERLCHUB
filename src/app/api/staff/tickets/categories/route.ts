import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { staffIdentity, logStaffAction, ticketCategories } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

/** Categorías de tickets, administrables por el Staff (spec: "Configurar desde el sistema"). */
export async function GET() {
  const denied = await requirePermission('tickets.view');
  if (denied) return denied;

  try {
    const col = await ticketCategories();
    const docs = await col.find({}).sort({ name: 1 }).toArray();
    return NextResponse.json({ success: true, categories: docs.map(({ _id, ...c }: any) => c) });
  } catch (error) {
    console.error('Error listando categorías de tickets:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requirePermission('tickets.manage');
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    const { name } = await request.json();
    if (!name?.trim()) return NextResponse.json({ success: false, error: 'Falta el nombre' }, { status: 400 });

    const col = await ticketCategories();
    const existing = await col.findOne({ name: name.trim() });
    if (existing) return NextResponse.json({ success: false, error: 'Ya existe esa categoría' }, { status: 409 });

    const doc = { id: crypto.randomUUID(), name: name.trim(), createdAt: new Date() };
    await col.insertOne(doc);
    await logStaffAction({
      type: 'ticket_category_created', category: 'TICKET', actor: identity?.name || 'Staff', actorId: identity?.id,
      description: `${identity?.name || 'Staff'} creó la categoría de tickets "${doc.name}"`,
    });
    return NextResponse.json({ success: true, category: doc });
  } catch (error) {
    console.error('Error creando categoría de tickets:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear la categoría' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await requirePermission('tickets.manage');
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await ticketCategories();
    const existing = await col.findOne({ id });
    await col.deleteOne({ id });

    if (existing) {
      await logStaffAction({
        type: 'ticket_category_deleted', category: 'TICKET', actor: identity?.name || 'Staff', actorId: identity?.id,
        description: `${identity?.name || 'Staff'} eliminó la categoría de tickets "${existing.name}"`,
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando categoría de tickets:', error);
    return NextResponse.json({ success: false, error: 'No se pudo eliminar' }, { status: 500 });
  }
}
