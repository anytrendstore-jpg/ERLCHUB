import { NextRequest, NextResponse } from 'next/server';
import { staffIdentity, logStaffAction } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';
import { careerProfilesCollection, careerReportsCollection } from '@/lib/hubCareerServer';
import { companiesCollection, jobPostingsCollection, applicationsCollection } from '@/lib/hubCareerJobsServer';
import { careerPostsCollection } from '@/lib/hubCareerFeedServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const denied = await requirePermission('hubcareer.manage');
  if (denied) return denied;

  try {
    const [profilesCol, companiesCol, jobsCol, appsCol, postsCol, reportsCol] = await Promise.all([
      careerProfilesCollection(), companiesCollection(), jobPostingsCollection(), applicationsCollection(), careerPostsCollection(), careerReportsCollection(),
    ]);

    const [profileCount, companies, openJobs, totalApps, postCount, reports] = await Promise.all([
      profilesCol.countDocuments(), companiesCol.find({}).sort({ createdAt: -1 }).toArray(),
      jobsCol.countDocuments({ status: 'open' }), appsCol.countDocuments(), postsCol.countDocuments(),
      reportsCol.find({}).sort({ createdAt: -1 }).limit(100).toArray(),
    ]);

    const stats = { profileCount, companyCount: companies.length, openJobs, totalApplications: totalApps, postCount, pendingReports: reports.filter((r) => r.status === 'pending').length };
    return NextResponse.json({ success: true, stats, companies: companies.map(({ _id, ...c }: any) => c), reports: reports.map(({ _id, ...r }: any) => r) });
  } catch (error) {
    console.error('Error leyendo administración de HubCareer:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

const COMPANY_EDIT_KEYS = ['name', 'description', 'category', 'location', 'website', 'contactInfo'] as const;

/**
 * action: 'verify_company' | 'unverify_company' | 'verify_user' | 'unverify_user' | 'resolve_report' | 'dismiss_report'
 *       | 'edit_company' | 'toggle_approved' | 'transfer_ownership'
 */
export async function PATCH(request: NextRequest) {
  const denied = await requirePermission('hubcareer.manage');
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    const body = await request.json();

    if (body.action === 'verify_company' || body.action === 'unverify_company') {
      const col = await companiesCollection();
      const company = await col.findOne({ id: body.companyId });
      if (!company) return NextResponse.json({ success: false, error: 'Empresa no encontrada' }, { status: 404 });
      const verified = body.action === 'verify_company';
      await col.updateOne({ id: body.companyId }, { $set: { verified } });
      await logStaffAction({
        type: 'hubcareer_verification_changed', category: 'SOCIAL', actor: identity?.name || 'Staff', actorId: identity?.id, target: company.name,
        description: `${identity?.name || 'Staff'} ${verified ? 'verificó' : 'quitó la verificación de'} la empresa "${company.name}" en HubCareer`,
      });
      return NextResponse.json({ success: true });
    }

    if (body.action === 'verify_user' || body.action === 'unverify_user') {
      const col = await careerProfilesCollection();
      const profile = await col.findOne({ discordId: body.discordId });
      if (!profile) return NextResponse.json({ success: false, error: 'Perfil no encontrado' }, { status: 404 });
      const verified = body.action === 'verify_user';
      await col.updateOne({ discordId: body.discordId }, { $set: { verified, verifiedBy: verified ? (identity?.name || 'Staff') : undefined } });
      await logStaffAction({
        type: 'hubcareer_verification_changed', category: 'SOCIAL', actor: identity?.name || 'Staff', actorId: identity?.id, target: profile.displayName,
        description: `${identity?.name || 'Staff'} ${verified ? 'verificó' : 'quitó la verificación de'} el perfil de ${profile.displayName} en HubCareer`,
      });
      return NextResponse.json({ success: true });
    }

    if (body.action === 'resolve_report' || body.action === 'dismiss_report') {
      const col = await careerReportsCollection();
      const report = await col.findOne({ id: body.reportId });
      if (!report) return NextResponse.json({ success: false, error: 'Reporte no encontrado' }, { status: 404 });
      const status = body.action === 'resolve_report' ? 'reviewed' : 'dismissed';
      await col.updateOne({ id: body.reportId }, { $set: { status, resolvedBy: identity?.name || 'Staff', resolvedAt: new Date() } });
      await logStaffAction({
        type: 'hubcareer_report_resolved', category: 'SOCIAL', actor: identity?.name || 'Staff', actorId: identity?.id, target: report.targetLabel,
        description: `${identity?.name || 'Staff'} marcó como "${status === 'reviewed' ? 'revisado' : 'descartado'}" un reporte de HubCareer sobre "${report.targetLabel}"`,
      });
      return NextResponse.json({ success: true });
    }

    if (body.action === 'edit_company') {
      const col = await companiesCollection();
      const company = await col.findOne({ id: body.companyId });
      if (!company) return NextResponse.json({ success: false, error: 'Empresa no encontrada' }, { status: 404 });
      const updates: Record<string, unknown> = {};
      for (const key of COMPANY_EDIT_KEYS) {
        if (key in body && typeof body[key] === 'string' && body[key].trim()) updates[key] = body[key].trim();
      }
      if (Object.keys(updates).length === 0) return NextResponse.json({ success: false, error: 'Sin cambios válidos' }, { status: 400 });
      updates.updatedAt = new Date();
      await col.updateOne({ id: body.companyId }, { $set: updates });
      await logStaffAction({
        type: 'hubcareer_company_edited', category: 'SOCIAL', actor: identity?.name || 'Staff', actorId: identity?.id, target: company.name,
        description: `${identity?.name || 'Staff'} editó datos de la empresa "${company.name}" en HubCareer`,
        metadata: updates,
      });
      return NextResponse.json({ success: true });
    }

    if (body.action === 'toggle_approved') {
      const col = await companiesCollection();
      const company = await col.findOne({ id: body.companyId });
      if (!company) return NextResponse.json({ success: false, error: 'Empresa no encontrada' }, { status: 404 });
      const approved = !company.approved;
      await col.updateOne({ id: body.companyId }, { $set: { approved } });
      await logStaffAction({
        type: 'hubcareer_company_status_changed', category: 'SOCIAL', actor: identity?.name || 'Staff', actorId: identity?.id, target: company.name,
        description: `${identity?.name || 'Staff'} ${approved ? 'reactivó' : 'desactivó'} la empresa "${company.name}" en HubCareer (${approved ? 'vuelve a ser visible' : 'oculta de búsquedas'})`,
      });
      return NextResponse.json({ success: true });
    }

    if (body.action === 'transfer_ownership') {
      const col = await companiesCollection();
      const company = await col.findOne({ id: body.companyId });
      if (!company) return NextResponse.json({ success: false, error: 'Empresa no encontrada' }, { status: 404 });
      if (!body.newOwnerId) return NextResponse.json({ success: false, error: 'Falta el nuevo dueño' }, { status: 400 });
      await col.updateOne({ id: body.companyId }, { $set: { ownerId: body.newOwnerId } });
      await logStaffAction({
        type: 'hubcareer_company_edited', category: 'SOCIAL', actor: identity?.name || 'Staff', actorId: identity?.id, target: company.name,
        description: `${identity?.name || 'Staff'} transfirió la propiedad de la empresa "${company.name}" a otro jugador`,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('Error administrando HubCareer:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}
