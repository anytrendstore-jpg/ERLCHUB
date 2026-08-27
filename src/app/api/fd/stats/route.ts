import { NextResponse } from 'next/server';
import { currentMDTUser, mdtCallsCollection } from '@/lib/mdtServer';
import { fdFirefightersCollection, fdReportsCollection, fdCasesCollection, fdEquipmentCollection, fdCertificationsCollection } from '@/lib/fdServer';
import { checkFactionAccess } from '@/lib/factionsServer';
import type { FireReportStatus } from '@/lib/fdTypes';
import type { FDCaseStatus } from '@/lib/fdTypes';
import type { FDEquipmentStatus } from '@/lib/fdTypes';

export const dynamic = 'force-dynamic';

const REPORT_STATUSES: FireReportStatus[] = ['Draft', 'Pending Review', 'Approved', 'Rejected'];
const CASE_STATUSES: FDCaseStatus[] = ['Open', 'Under Investigation', 'Closed', 'Referred'];
const EQUIPMENT_STATUSES: FDEquipmentStatus[] = ['In Service', 'Out of Service', 'Maintenance', 'Reserve'];

/** Estadísticas del departamento — agregaciones reales sobre las colecciones existentes, nada precalculado/inventado. */
export async function GET() {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });
  const access = await checkFactionAccess(user.id, 'LSFD');
  if (!access.allowed) return NextResponse.json({ success: false, error: 'No sos miembro activo de LSFD' }, { status: 403 });

  try {
    const [personnelCol, reportsCol, casesCol, equipmentCol, certsCol, callsCol] = await Promise.all([
      fdFirefightersCollection(), fdReportsCollection(), fdCasesCollection(), fdEquipmentCollection(), fdCertificationsCollection(), mdtCallsCollection(),
    ]);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      personnelTotal, onDutyCount,
      reportCounts, caseCounts, equipmentCounts,
      certActive, certExpiringSoon, certExpired, certRevoked,
      callsTotal, callsLast7Days,
    ] = await Promise.all([
      personnelCol.countDocuments({}),
      personnelCol.countDocuments({ onDuty: true }),
      Promise.all(REPORT_STATUSES.map((s) => reportsCol.countDocuments({ status: s }))),
      Promise.all(CASE_STATUSES.map((s) => casesCol.countDocuments({ status: s }))),
      Promise.all(EQUIPMENT_STATUSES.map((s) => equipmentCol.countDocuments({ status: s }))),
      certsCol.countDocuments({ status: 'Active', $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gte: in30Days } }] }),
      certsCol.countDocuments({ status: 'Active', expiresAt: { $gte: now, $lt: in30Days } }),
      certsCol.countDocuments({ status: 'Expired' }),
      certsCol.countDocuments({ status: 'Revoked' }),
      callsCol.countDocuments({ faction: 'Bomberos' }),
      callsCol.countDocuments({ faction: 'Bomberos', createdAt: { $gte: sevenDaysAgo } }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        personnel: { total: personnelTotal, onDuty: onDutyCount },
        reports: Object.fromEntries(REPORT_STATUSES.map((s, i) => [s, reportCounts[i]])),
        cases: Object.fromEntries(CASE_STATUSES.map((s, i) => [s, caseCounts[i]])),
        equipment: Object.fromEntries(EQUIPMENT_STATUSES.map((s, i) => [s, equipmentCounts[i]])),
        certifications: { active: certActive, expiringSoon: certExpiringSoon, expired: certExpired, revoked: certRevoked },
        calls: { total: callsTotal, last7Days: callsLast7Days },
      },
    });
  } catch (error) {
    console.error('Error calculando estadísticas de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
