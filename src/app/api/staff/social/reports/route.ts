import { NextRequest, NextResponse } from 'next/server';
import { staffIdentity, logStaffAction } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';
import { socialReportsCollection } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

/** Lista reportes de HubSocial. status=pending|reviewed|dismissed|all */
export async function GET(request: NextRequest) {
  const denied = await requirePermission('hubsocial.moderate');
  if (denied) return denied;

  try {
    const status = request.nextUrl.searchParams.get('status') || 'pending';
    const query: Record<string, unknown> = status === 'all' ? {} : { status };

    const col = await socialReportsCollection();
    const docs = await col.find(query).sort({ createdAt: -1 }).limit(150).toArray();
    return NextResponse.json({ success: true, reports: docs.map(({ _id, ...r }: any) => r) });
  } catch (error) {
    console.error('Error listando reportes de HubSocial:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** action: 'review' | 'dismiss' */
export async function PATCH(request: NextRequest) {
  const denied = await requirePermission('hubsocial.moderate');
  if (denied) return denied;

  try {
    const { reportId, action } = await request.json();
    if (!reportId || !['review', 'dismiss'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
    }

    const col = await socialReportsCollection();
    const report = await col.findOne({ id: reportId });
    if (!report) return NextResponse.json({ success: false, error: 'Reporte no encontrado' }, { status: 404 });

    const identity = staffIdentity();
    const actorName = identity?.name || 'Staff';
    const status = action === 'review' ? 'reviewed' : 'dismissed';

    await col.updateOne({ id: reportId }, { $set: { status, resolvedBy: actorName, resolvedAt: new Date() } });

    await logStaffAction({
      type: 'social_report_resolved', category: 'SOCIAL', actor: actorName, actorId: identity?.id,
      target: reportId,
      description: `${actorName} marcó un reporte de HubSocial como ${status === 'reviewed' ? 'revisado' : 'descartado'}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error actualizando reporte de HubSocial:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}
