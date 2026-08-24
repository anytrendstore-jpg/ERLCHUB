import { NextRequest, NextResponse } from 'next/server';
import { socialGroupsCollection, socialGroupMembersCollection, socialPostsCollection, currentSocialUser, isGroupAdmin } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

const DESCRIPTION_MAX = 300;
const CATEGORY_MAX = 40;

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await socialGroupsCollection();
    const group = await col.findOne({ id: params.id });
    if (!group) return NextResponse.json({ success: false, error: 'No existe' }, { status: 404 });

    const membersCol = await socialGroupMembersCollection();
    const [memberCount, postsCol, myMembership] = await Promise.all([
      membersCol.countDocuments({ groupId: group.id, status: 'active' }),
      socialPostsCollection(),
      membersCol.findOne({ groupId: group.id, discordId: user.id }),
    ]);
    const postsCount = await postsCol.countDocuments({ groupId: group.id });

    const { _id, ...clean } = group as any;
    return NextResponse.json({
      success: true,
      group: {
        ...clean,
        memberCount,
        postsCount,
        myRole: myMembership?.status === 'active' ? myMembership.role : undefined,
        isPending: myMembership?.status === 'pending',
        isAdmin: isGroupAdmin(myMembership),
      },
    });
  } catch (error) {
    console.error('Error obteniendo grupo:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** Editar datos del grupo — solo dueño/admins. */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await socialGroupsCollection();
    const group = await col.findOne({ id: params.id });
    if (!group) return NextResponse.json({ success: false, error: 'No existe' }, { status: 404 });

    const membersCol = await socialGroupMembersCollection();
    const membership = await membersCol.findOne({ groupId: group.id, discordId: user.id });
    if (!isGroupAdmin(membership)) {
      return NextResponse.json({ success: false, error: 'Solo el dueño o administradores pueden editar el grupo' }, { status: 403 });
    }

    const { description, category, coverImage, icon } = await request.json();
    const update: Record<string, unknown> = {};
    if (description !== undefined) update.description = String(description).trim().slice(0, DESCRIPTION_MAX);
    if (category !== undefined) update.category = String(category).trim().slice(0, CATEGORY_MAX);
    if (coverImage !== undefined) update.coverImage = String(coverImage).trim().slice(0, 1000);
    if (icon !== undefined) update.icon = String(icon).trim().slice(0, 1000);

    await col.updateOne({ id: params.id }, { $set: update });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error editando grupo:', error);
    return NextResponse.json({ success: false, error: 'No se pudo editar' }, { status: 500 });
  }
}
