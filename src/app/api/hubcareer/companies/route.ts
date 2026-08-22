import { NextRequest, NextResponse } from 'next/server';
import { currentCareerUser, } from '@/lib/hubCareerServer';
import { companiesCollection, createCompany } from '@/lib/hubCareerJobsServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const id = request.nextUrl.searchParams.get('id');
    const q = request.nextUrl.searchParams.get('q');
    const col = await companiesCollection();

    if (id) {
      const company = await col.findOne({ id });
      if (!company) return NextResponse.json({ success: false, error: 'Empresa no encontrada' }, { status: 404 });
      const isAdmin = company.ownerId === me.id || company.admins.includes(me.id);
      if (!company.approved && !isAdmin) return NextResponse.json({ success: false, error: 'Empresa no encontrada' }, { status: 404 });
      const { _id, ...clean } = company as any;
      return NextResponse.json({ success: true, company: { ...clean, isFollowing: company.followers.includes(me.id), isAdmin } });
    }

    const filter: Record<string, unknown> = { approved: true };
    if (q) filter.name = { $regex: q, $options: 'i' };
    const docs = await col.find(filter).sort({ createdAt: -1 }).limit(60).toArray();
    return NextResponse.json({ success: true, companies: docs.map(({ _id, ...c }: any) => ({ ...c, isFollowing: c.followers.includes(me.id) })) });
  } catch (error) {
    console.error('Error leyendo empresas:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const body = await request.json();
    if (!body.name?.trim() || !body.description?.trim() || !body.category || !body.location) {
      return NextResponse.json({ success: false, error: 'Faltan campos requeridos' }, { status: 400 });
    }
    const result = await createCompany(me.id, {
      name: body.name.trim(), description: body.description.trim(), category: body.category, location: body.location,
      website: body.website, contactInfo: body.contactInfo, logo: body.logo,
    });
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, company: result.company });
  } catch (error) {
    console.error('Error creando empresa:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear' }, { status: 500 });
  }
}
