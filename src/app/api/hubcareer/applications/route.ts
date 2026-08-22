import { NextRequest, NextResponse } from 'next/server';
import { currentCareerUser } from '@/lib/hubCareerServer';
import { applicationsCollection, applyToJob, updateApplicationStatus, companiesCollection, isCompanyAdmin } from '@/lib/hubCareerJobsServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const companyId = request.nextUrl.searchParams.get('companyId');
    const col = await applicationsCollection();

    if (companyId) {
      const companiesCol = await companiesCollection();
      const company = await companiesCol.findOne({ id: companyId });
      if (!company || !isCompanyAdmin(company, me.id)) return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
      const docs = await col.find({ companyId }).sort({ createdAt: -1 }).toArray();
      return NextResponse.json({ success: true, applications: docs.map(({ _id, ...a }: any) => a) });
    }

    const docs = await col.find({ applicantId: me.id }).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ success: true, applications: docs.map(({ _id, ...a }: any) => a) });
  } catch (error) {
    console.error('Error leyendo postulaciones:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { jobId, note } = await request.json();
    if (!jobId) return NextResponse.json({ success: false, error: 'Falta la vacante' }, { status: 400 });
    const result = await applyToJob(me.id, jobId, note);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error postulando:', error);
    return NextResponse.json({ success: false, error: 'No se pudo postular' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { applicationId, status } = await request.json();
    if (!applicationId || !status) return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });
    const result = await updateApplicationStatus(me.id, applicationId, status);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error actualizando postulación:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}
