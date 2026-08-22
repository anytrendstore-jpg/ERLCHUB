import { NextRequest, NextResponse } from 'next/server';
import { currentCareerUser } from '@/lib/hubCareerServer';
import { careerEventsCollection, createEvent } from '@/lib/hubCareerJobsServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const companyId = request.nextUrl.searchParams.get('companyId');
    const col = await careerEventsCollection();
    const filter = companyId ? { companyId } : { date: { $gte: new Date().toISOString().slice(0, 10) } };
    const docs = await col.find(filter).sort({ date: 1 }).limit(60).toArray();
    return NextResponse.json({ success: true, events: docs.map(({ _id, ...e }: any) => ({ ...e, isAttending: e.attending.includes(me.id), isNotAttending: e.notAttending.includes(me.id) })) });
  } catch (error) {
    console.error('Error leyendo eventos de HubCareer:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const body = await request.json();
    if (!body.companyId || !body.name?.trim() || !body.date || !body.location?.trim() || !body.description?.trim()) {
      return NextResponse.json({ success: false, error: 'Faltan campos requeridos' }, { status: 400 });
    }
    const result = await createEvent(body.companyId, me.id, {
      name: body.name.trim(), date: body.date, time: body.time, location: body.location.trim(), description: body.description.trim(),
    });
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, event: result.event });
  } catch (error) {
    console.error('Error creando evento de HubCareer:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear' }, { status: 500 });
  }
}
