import { NextRequest, NextResponse } from 'next/server';
import { socialPagesCollection, socialPostsCollection, currentSocialUser, isPageAdmin } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

const BIO_MAX = 300;

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await socialPagesCollection();
    const page = await col.findOne({ id: params.id });
    if (!page) return NextResponse.json({ success: false, error: 'No existe' }, { status: 404 });

    const postsCol = await socialPostsCollection();
    const postsCount = await postsCol.countDocuments({ authorPageId: page.id });

    const { _id, ...clean } = page as any;
    return NextResponse.json({
      success: true,
      page: {
        ...clean,
        followersCount: page.followers.length,
        postsCount,
        isFollowing: page.followers.includes(user.id),
        isAdmin: isPageAdmin(page, user.id),
      },
    });
  } catch (error) {
    console.error('Error obteniendo página:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** Editar datos de la página — solo dueño/admins. */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await socialPagesCollection();
    const page = await col.findOne({ id: params.id });
    if (!page) return NextResponse.json({ success: false, error: 'No existe' }, { status: 404 });
    if (!isPageAdmin(page, user.id)) {
      return NextResponse.json({ success: false, error: 'Solo el dueño o administradores pueden editar la página' }, { status: 403 });
    }

    const { bio, avatarUrl, coverUrl, phone, email, website, location } = await request.json();
    const update: Record<string, unknown> = {};
    if (bio !== undefined) update.bio = String(bio).trim().slice(0, BIO_MAX);
    if (avatarUrl !== undefined) update.avatarUrl = String(avatarUrl).trim().slice(0, 1000);
    if (coverUrl !== undefined) update.coverUrl = String(coverUrl).trim().slice(0, 1000);
    if (phone !== undefined) update.phone = String(phone).trim().slice(0, 40);
    if (email !== undefined) update.email = String(email).trim().slice(0, 100);
    if (website !== undefined) update.website = String(website).trim().slice(0, 200);
    if (location !== undefined) update.location = String(location).trim().slice(0, 100);

    await col.updateOne({ id: params.id }, { $set: update });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error editando página:', error);
    return NextResponse.json({ success: false, error: 'No se pudo editar' }, { status: 500 });
  }
}
