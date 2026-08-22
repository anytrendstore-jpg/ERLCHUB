import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { applications } from '@/lib/whitelistServer';
import { isDirector, requireStaff, staffAnnouncements, staffAudit, staffIdentity, staffReports, staffTickets, staffSanctions, staffShifts } from '@/lib/staffServer';
import { iaCasesCollection } from '@/lib/internalAffairsServer';
import { hasPermission } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

/**
 * Resumen para "Mission Control": KPIs reales de la base de datos, comunicados
 * fijados, actividad reciente e identidad del staff conectado.
 */
export async function GET() {
  const denied = requireStaff();
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    const canSeeInternalAffairs = await hasPermission(identity, 'internal_affairs.view');

    const db = await connectToDatabase();
    const [appsCol, ticketsCol, reportsCol, announcementsCol, auditCol, sanctionsCol, shiftsCol] = await Promise.all([
      applications(),
      staffTickets(),
      staffReports(),
      staffAnnouncements(),
      staffAudit(),
      staffSanctions(),
      staffShifts(),
    ]);

    const [
      whitelistPending,
      ticketsOpen,
      reportsPending,
      registeredPlayers,
      announcements,
      recentActivity,
      sanctionsActive,
      staffOnDuty,
      internalCasesOpen,
    ] = await Promise.all([
      appsCol.countDocuments({ status: { $in: ['pending', 'in_review'] } }),
      ticketsCol.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      reportsCol.countDocuments({ status: { $in: ['open', 'in_review', 'assigned', 'investigating'] } }),
      db.collection('users').countDocuments({}),
      announcementsCol.find({}).sort({ pinned: -1, createdAt: -1 }).limit(10).toArray(),
      auditCol.find({}).sort({ createdAt: -1 }).limit(15).toArray(),
      sanctionsCol.countDocuments({ active: true }),
      shiftsCol.countDocuments({ clockOut: { $exists: false } }),
      canSeeInternalAffairs ? iaCasesCollection().then((c) => c.countDocuments({ status: { $nin: ['resolved', 'archived'] } })) : Promise.resolve(null),
    ]);

    return NextResponse.json({
      success: true,
      kpis: {
        registeredPlayers,
        ticketsOpen,
        reportsPending,
        whitelistPending,
        sanctionsActive,
        staffOnDuty,
        internalCasesOpen,
      },
      announcements: announcements.map(({ _id, ...a }: any) => a),
      recentActivity: recentActivity.map(({ _id, ...a }: any) => a),
      identity,
      isDirector: isDirector(),
    });
  } catch (error) {
    console.error('Error cargando el panel de staff:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
