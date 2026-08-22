import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { logStaffAction, requireStaff, staffAnnouncements, staffIdentity } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  const denied = requireStaff();
  if (denied) return denied;

  try {
    const col = await staffAnnouncements();
    const docs = await col.find({}).sort({ pinned: -1, createdAt: -1 }).limit(50).toArray();
    return NextResponse.json({ success: true, announcements: docs.map(({ _id, ...a }: any) => a) });
  } catch (error) {
    console.error('Error listando comunicados:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requirePermission('dashboard.announce');
  if (denied) return denied;

  try {
    const { title, body, scope, pinned } = await request.json();
    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json({ success: false, error: 'Falta título o contenido' }, { status: 400 });
    }

    const identity = staffIdentity();
    const col = await staffAnnouncements();
    const doc = {
      id: crypto.randomUUID(),
      title: title.trim(),
      body: body.trim(),
      scope: scope || 'GLOBAL',
      pinned: Boolean(pinned),
      author: identity?.name || 'Staff',
      authorId: identity?.id,
      createdAt: new Date(),
    };
    await col.insertOne(doc);
    // `insertOne` inyecta `_id` en el objeto que le pasamos: lo quitamos antes de devolverlo.
    const { _id, ...announcement } = doc as typeof doc & { _id?: unknown };

    await logStaffAction({
      type: 'announcement_created',
      category: 'STAFF',
      actor: doc.author,
      actorId: identity?.id,
      description: `Publicó un comunicado: "${doc.title}"`,
    });

    return NextResponse.json({ success: true, announcement });
  } catch (error) {
    console.error('Error creando comunicado:', error);
    return NextResponse.json({ success: false, error: 'No se pudo publicar el comunicado' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await requirePermission('dashboard.announce');
  if (denied) return denied;

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await staffAnnouncements();
    const doc = await col.findOne({ id });
    await col.deleteOne({ id });

    if (doc) {
      const identity = staffIdentity();
      await logStaffAction({
        type: 'announcement_deleted',
        category: 'STAFF',
        actor: identity?.name || 'Staff',
        actorId: identity?.id,
        description: `Eliminó el comunicado: "${doc.title}"`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando comunicado:', error);
    return NextResponse.json({ success: false, error: 'No se pudo eliminar' }, { status: 500 });
  }
}
