import { NextRequest, NextResponse } from 'next/server';
import { currentCareerUser } from '@/lib/hubCareerServer';
import { toggleFollowCompany } from '@/lib/hubCareerJobsServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { companyId } = await request.json();
    if (!companyId) return NextResponse.json({ success: false, error: 'Falta la empresa' }, { status: 400 });
    const result = await toggleFollowCompany(me.id, companyId);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, following: result.following });
  } catch (error) {
    console.error('Error siguiendo empresa:', error);
    return NextResponse.json({ success: false, error: 'No se pudo procesar' }, { status: 500 });
  }
}
