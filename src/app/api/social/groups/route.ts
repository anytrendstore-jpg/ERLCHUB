import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { socialGroupsCollection, socialGroupMembersCollection, currentSocialUser } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

const NAME_MAX = 60;
const CATEGORY_MAX = 40;
const DESCRIPTION_MAX = 300;

export async function GET(request: NextRequest) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const q = request.nextUrl.searchParams.get('q')?.trim();
    const mine = request.nextUrl.searchParams.get('mine') === '1';

    const membersCol = await socialGroupMembersCollection();
    const myMemberships = await membersCol.find({ discordId: user.id }).toArray();
    const myMembershipByGroup = new Map(myMemberships.map((m) => [m.groupId, m]));

    const filter: Record<string, unknown> = {};
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (mine) filter.id = { $in: Array.from(myMembershipByGroup.keys()) };

    const col = await socialGroupsCollection();
    const docs = await col.find(filter).sort({ createdAt: -1 }).limit(50).toArray();

    const memberCounts = await membersCol.aggregate<{ _id: string; count: number }>([
      { $match: { groupId: { $in: docs.map((d) => d.id) }, status: 'active' } },
      { $group: { _id: '$groupId', count: { $sum: 1 } } },
    ]).toArray();
    const memberCountByGroup = new Map(memberCounts.map((c) => [c._id, c.count]));

    const groups = docs.map(({ _id, ...g }: any) => {
      const membership = myMembershipByGroup.get(g.id);
      return {
        ...g,
        memberCount: memberCountByGroup.get(g.id) || 0,
        myRole: membership?.status === 'active' ? membership.role : undefined,
        isPending: membership?.status === 'pending',
      };
    });

    return NextResponse.json({ success: true, groups });
  } catch (error) {
    console.error('Error listando grupos:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { name, description, category, privacy, coverImage, icon } = await request.json();
    const trimmedName = String(name || '').trim().slice(0, NAME_MAX);
    if (!trimmedName) {
      return NextResponse.json({ success: false, error: 'El nombre es obligatorio' }, { status: 400 });
    }
    const groupPrivacy = privacy === 'private' ? 'private' : 'public';

    const col = await socialGroupsCollection();
    const doc = {
      id: crypto.randomUUID(),
      name: trimmedName,
      description: description ? String(description).trim().slice(0, DESCRIPTION_MAX) : undefined,
      category: category ? String(category).trim().slice(0, CATEGORY_MAX) : undefined,
      coverImage: coverImage ? String(coverImage).trim().slice(0, 1000) : undefined,
      icon: icon ? String(icon).trim().slice(0, 1000) : undefined,
      privacy: groupPrivacy as 'public' | 'private',
      ownerId: user.id,
      createdAt: new Date(),
    };
    await col.insertOne(doc);

    const membersCol = await socialGroupMembersCollection();
    await membersCol.insertOne({
      groupId: doc.id,
      discordId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      role: 'owner',
      status: 'active',
      joinedAt: new Date(),
    });

    return NextResponse.json({ success: true, group: { ...doc, memberCount: 1, myRole: 'owner', isPending: false } });
  } catch (error) {
    console.error('Error creando grupo:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear el grupo' }, { status: 500 });
  }
}
