import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentCareerUser, careerProfilesCollection, getOrCreateProfile } from '@/lib/hubCareerServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    await getOrCreateProfile(me);
    const body = await request.json();
    if (!body.name?.trim()) return NextResponse.json({ success: false, error: 'Falta el nombre de la habilidad' }, { status: 400 });

    const col = await careerProfilesCollection();
    const profile = await col.findOne({ discordId: me.id });
    if (profile?.skills.some((s) => s.name.toLowerCase() === body.name.trim().toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Ya tienes esa habilidad' }, { status: 400 });
    }
    const entry = { id: crypto.randomUUID(), name: body.name.trim(), endorsements: [] as string[] };
    await col.updateOne({ discordId: me.id }, { $push: { skills: entry }, $set: { updatedAt: new Date() } });
    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Error agregando habilidad:', error);
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
    await col.updateOne({ discordId: me.id }, { $pull: { skills: { id } }, $set: { updatedAt: new Date() } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando habilidad:', error);
    return NextResponse.json({ success: false, error: 'No se pudo eliminar' }, { status: 500 });
  }
}

/** Avalar la habilidad de otro usuario (userId + skillId en el body). */
export async function PATCH(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { userId, skillId } = await request.json();
    if (!userId || !skillId) return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });
    if (userId === me.id) return NextResponse.json({ success: false, error: 'No puedes avalarte a ti mismo' }, { status: 400 });

    const col = await careerProfilesCollection();
    const profile = await col.findOne({ discordId: userId, 'skills.id': skillId });
    if (!profile) return NextResponse.json({ success: false, error: 'Habilidad no encontrada' }, { status: 404 });

    const skill = profile.skills.find((s) => s.id === skillId);
    const already = skill?.endorsements.includes(me.id);
    await col.updateOne(
      { discordId: userId, 'skills.id': skillId },
      already ? { $pull: { 'skills.$.endorsements': me.id } } : { $addToSet: { 'skills.$.endorsements': me.id } }
    );
    return NextResponse.json({ success: true, endorsed: !already });
  } catch (error) {
    console.error('Error avalando habilidad:', error);
    return NextResponse.json({ success: false, error: 'No se pudo avalar' }, { status: 500 });
  }
}
