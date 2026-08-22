import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentCareerUser, careerProfilesCollection, getOrCreateProfile, type WorkExperience } from '@/lib/hubCareerServer';

export const dynamic = 'force-dynamic';

/** Agrega experiencia laboral libre (historial declarado por el usuario, distinto de currentJob que solo lo fija una contratación real). */
export async function POST(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    await getOrCreateProfile(me);
    const body = await request.json();
    if (!body.title || !body.companyName || !body.startDate) {
      return NextResponse.json({ success: false, error: 'Faltan campos requeridos' }, { status: 400 });
    }
    const entry: WorkExperience = {
      id: crypto.randomUUID(), title: body.title, companyName: body.companyName, location: body.location,
      startDate: body.startDate, endDate: body.current ? undefined : body.endDate, current: Boolean(body.current),
      description: body.description,
    };
    const col = await careerProfilesCollection();
    await col.updateOne({ discordId: me.id }, { $push: { experience: entry }, $set: { updatedAt: new Date() } });
    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Error agregando experiencia:', error);
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
    await col.updateOne({ discordId: me.id }, { $pull: { experience: { id } }, $set: { updatedAt: new Date() } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando experiencia:', error);
    return NextResponse.json({ success: false, error: 'No se pudo eliminar' }, { status: 500 });
  }
}
