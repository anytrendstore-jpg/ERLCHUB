import { NextRequest, NextResponse } from 'next/server';
import { socialGroupMembersCollection, currentSocialUser, isGroupAdmin } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

/** Lista de miembros activos del grupo; las solicitudes pendientes solo se incluyen si
 * quien pregunta es admin/dueño (son las que tiene que aprobar). */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const membersCol = await socialGroupMembersCollection();
    const myMembership = await membersCol.findOne({ groupId: params.id, discordId: user.id });
    const admin = isGroupAdmin(myMembership);

    const active = await membersCol.find({ groupId: params.id, status: 'active' }).sort({ joinedAt: 1 }).toArray();
    const pending = admin
      ? await membersCol.find({ groupId: params.id, status: 'pending' }).sort({ joinedAt: 1 }).toArray()
      : [];

    return NextResponse.json({
      success: true,
      members: active.map(({ _id, ...m }: any) => m),
      pending: pending.map(({ _id, ...m }: any) => m),
      isAdmin: admin,
    });
  } catch (error) {
    console.error('Error listando miembros del grupo:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
