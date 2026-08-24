import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { socialEventsCollection, currentSocialUser } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

const NAME_MAX = 80;
const LOCATION_MAX = 100;
const DESCRIPTION_MAX = 500;

/** Eventos próximos (fecha >= hoy), opcionalmente filtrados por grupo/página o "los míos". */
export async function GET(request: NextRequest) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const groupId = request.nextUrl.searchParams.get('groupId');
    const pageId = request.nextUrl.searchParams.get('pageId');
    const mine = request.nextUrl.searchParams.get('mine') === '1';
    const today = new Date().toISOString().slice(0, 10);

    const filter: Record<string, unknown> = { date: { $gte: today } };
    if (groupId) filter.groupId = groupId;
    if (pageId) filter.pageId = pageId;
    if (mine) {
      filter.$or = [
        { organizerId: user.id },
        { interested: user.id },
        { attending: user.id },
      ];
    }

    const col = await socialEventsCollection();
    const docs = await col.find(filter).sort({ date: 1 }).limit(50).toArray();

    const events = docs.map(({ _id, ...e }: any) => ({
      ...e,
      interestedCount: e.interested.length,
      attendingCount: e.attending.length,
      myStatus: e.attending.includes(user.id) ? 'attending' : e.interested.includes(user.id) ? 'interested' : e.notAttending.includes(user.id) ? 'not_attending' : undefined,
    }));

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('Error listando eventos:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { name, description, coverImage, date, time, location } = await request.json();
    const trimmedName = String(name || '').trim().slice(0, NAME_MAX);
    const trimmedLocation = String(location || '').trim().slice(0, LOCATION_MAX);
    const trimmedDate = String(date || '').trim();
    if (!trimmedName || !trimmedLocation || !/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
      return NextResponse.json({ success: false, error: 'Nombre, fecha y lugar son obligatorios' }, { status: 400 });
    }

    const col = await socialEventsCollection();
    const doc = {
      id: crypto.randomUUID(),
      name: trimmedName,
      description: description ? String(description).trim().slice(0, DESCRIPTION_MAX) : undefined,
      coverImage: coverImage ? String(coverImage).trim().slice(0, 1000) : undefined,
      date: trimmedDate,
      time: time ? String(time).trim().slice(0, 5) : undefined,
      location: trimmedLocation,
      organizerId: user.id,
      organizerName: user.displayName,
      organizerAvatar: user.avatar,
      organizerType: 'user' as const,
      interested: [] as string[],
      attending: [] as string[],
      notAttending: [] as string[],
      createdAt: new Date(),
    };
    await col.insertOne(doc);

    return NextResponse.json({ success: true, event: { ...doc, interestedCount: 0, attendingCount: 0, myStatus: undefined } });
  } catch (error) {
    console.error('Error creando evento:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear el evento' }, { status: 500 });
  }
}
