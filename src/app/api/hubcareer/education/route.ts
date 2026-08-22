import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentCareerUser, careerProfilesCollection, getOrCreateProfile, type Education } from '@/lib/hubCareerServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    await getOrCreateProfile(me);
    const body = await request.json();
    if (!body.institution || !body.program || !body.startDate) {
      return NextResponse.json({ success: false, error: 'Faltan campos requeridos' }, { status: 400 });
    }
    const entry: Education = {
      id: crypto.randomUUID(), institution: body.institution, program: body.program,
      startDate: body.startDate, endDate: body.endDate, description: body.description, certification: body.certification,
    };
    const col = await careerProfilesCollection();
    await col.updateOne({ discordId: me.id }, { $push: { education: entry }, $set: { updatedAt: new Date() } });
    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Error agregando educación:', error);
    return NextResponse.json({ success: false, error: 'No se pudo agregar' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });
    const col = await careerProfilesCollection();
    await col.updateOne({ discordId: me.id }, { $pull: { education: { id } }, $set: { updatedAt: new Date() } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando educación:', error);
    return NextResponse.json({ success: false, error: 'No se pudo eliminar' }, { status: 500 });
  }
}
