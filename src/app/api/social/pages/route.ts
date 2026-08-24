import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { socialPagesCollection, currentSocialUser } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

const CATEGORY_MAX = 40;
const NAME_MAX = 60;
const BIO_MAX = 300;

export async function GET(request: NextRequest) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const q = request.nextUrl.searchParams.get('q')?.trim();
    const mine = request.nextUrl.searchParams.get('mine') === '1';

    const filter: Record<string, unknown> = {};
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (mine) filter.$or = [{ ownerId: user.id }, { admins: user.id }];

    const col = await socialPagesCollection();
    const docs = await col.find(filter).sort({ createdAt: -1 }).limit(50).toArray();

    const pages = docs.map(({ _id, ...p }: any) => ({
      ...p,
      followersCount: (p.followers || []).length,
      isFollowing: (p.followers || []).includes(user.id),
      isAdmin: p.ownerId === user.id || (p.admins || []).includes(user.id),
    }));

    return NextResponse.json({ success: true, pages });
  } catch (error) {
    console.error('Error listando páginas:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { name, category, bio, avatarUrl, coverUrl, phone, email, website, location } = await request.json();
    const trimmedName = String(name || '').trim().slice(0, NAME_MAX);
    const trimmedCategory = String(category || '').trim().slice(0, CATEGORY_MAX);
    if (!trimmedName || !trimmedCategory) {
      return NextResponse.json({ success: false, error: 'Nombre y categoría son obligatorios' }, { status: 400 });
    }

    const col = await socialPagesCollection();
    const doc = {
      id: crypto.randomUUID(),
      name: trimmedName,
      category: trimmedCategory,
      bio: bio ? String(bio).trim().slice(0, BIO_MAX) : undefined,
      avatarUrl: avatarUrl ? String(avatarUrl).trim().slice(0, 1000) : undefined,
      coverUrl: coverUrl ? String(coverUrl).trim().slice(0, 1000) : undefined,
      phone: phone ? String(phone).trim().slice(0, 40) : undefined,
      email: email ? String(email).trim().slice(0, 100) : undefined,
      website: website ? String(website).trim().slice(0, 200) : undefined,
      location: location ? String(location).trim().slice(0, 100) : undefined,
      verified: false,
      ownerId: user.id,
      admins: [] as string[],
      followers: [] as string[],
      createdAt: new Date(),
    };
    await col.insertOne(doc);

    return NextResponse.json({ success: true, page: { ...doc, followersCount: 0, isFollowing: false, isAdmin: true } });
  } catch (error) {
    console.error('Error creando página:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear la página' }, { status: 500 });
  }
}
