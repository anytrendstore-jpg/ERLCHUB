import { NextRequest, NextResponse } from 'next/server';
import { currentCareerUser } from '@/lib/hubCareerServer';
import { jobPostingsCollection, postJob } from '@/lib/hubCareerJobsServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const q = request.nextUrl.searchParams.get('q');
    const companyId = request.nextUrl.searchParams.get('companyId');
    const col = await jobPostingsCollection();
    const filter: Record<string, unknown> = companyId ? { companyId } : { status: 'open' };
    if (q) filter.title = { $regex: q, $options: 'i' };

    const docs = await col.find(filter).sort({ createdAt: -1 }).limit(60).toArray();
    return NextResponse.json({ success: true, jobs: docs.map(({ _id, ...j }: any) => j) });
  } catch (error) {
    console.error('Error leyendo vacantes:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const body = await request.json();
    if (!body.companyId || !body.title?.trim() || !body.salary || !body.location || !body.type || !body.schedule || !body.requirements || !body.description || !body.positions) {
      return NextResponse.json({ success: false, error: 'Faltan campos requeridos' }, { status: 400 });
    }
    const result = await postJob(body.companyId, me.id, {
      title: body.title.trim(), salary: Number(body.salary), location: body.location, type: body.type,
      schedule: body.schedule, requirements: body.requirements, description: body.description,
      positions: Number(body.positions), closesAt: body.closesAt ? new Date(body.closesAt) : undefined,
    });
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, job: result.job });
  } catch (error) {
    console.error('Error publicando vacante:', error);
    return NextResponse.json({ success: false, error: 'No se pudo publicar' }, { status: 500 });
  }
}
