import { NextRequest, NextResponse } from 'next/server';
import { socialGroupsCollection, socialGroupMembersCollection, currentSocialUser, isGroupAdmin } from '@/lib/socialServer';
import { notifyUser } from '@/lib/notificationsServer';

export const dynamic = 'force-dynamic';

/** Une/saca a jugadores de un grupo. Grupos públicos: unirse activa la membresía al
 * instante. Grupos privados: la membresía queda `pending` hasta que un admin la
 * aprueba/rechaza a mano (acciones `approve`/`reject`, solo para admins/dueño). */
export async function POST(request: NextRequest) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { groupId, action, targetId } = await request.json();
    if (!groupId || !action) return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });

    const groupsCol = await socialGroupsCollection();
    const group = await groupsCol.findOne({ id: groupId });
    if (!group) return NextResponse.json({ success: false, error: 'No existe' }, { status: 404 });

    const membersCol = await socialGroupMembersCollection();

    if (action === 'join') {
      const existing = await membersCol.findOne({ groupId, discordId: user.id });
      if (existing) {
        return NextResponse.json({ success: false, error: existing.status === 'pending' ? 'Ya enviaste una solicitud' : 'Ya sos miembro' }, { status: 400 });
      }
      const status = group.privacy === 'private' ? 'pending' : 'active';
      await membersCol.insertOne({
        groupId, discordId: user.id, username: user.username, displayName: user.displayName, avatar: user.avatar,
        role: 'member', status, joinedAt: new Date(),
      });
      if (status === 'pending') {
        await notifyUser(group.ownerId, {
          title: 'Nueva solicitud de grupo',
          message: `${user.displayName} quiere unirse a ${group.name}`,
          type: 'info',
          appId: 'hubsocial',
        });
      }
      return NextResponse.json({ success: true, status });
    }

    if (action === 'leave') {
      const membership = await membersCol.findOne({ groupId, discordId: user.id });
      if (membership?.role === 'owner') {
        return NextResponse.json({ success: false, error: 'El dueño no puede abandonar el grupo' }, { status: 400 });
      }
      await membersCol.deleteOne({ groupId, discordId: user.id });
      return NextResponse.json({ success: true });
    }

    if (action === 'approve' || action === 'reject') {
      if (!targetId) return NextResponse.json({ success: false, error: 'Falta el usuario objetivo' }, { status: 400 });
      const myMembership = await membersCol.findOne({ groupId, discordId: user.id });
      if (!isGroupAdmin(myMembership)) {
        return NextResponse.json({ success: false, error: 'Solo el dueño o administradores pueden gestionar solicitudes' }, { status: 403 });
      }
      if (action === 'approve') {
        await membersCol.updateOne({ groupId, discordId: targetId, status: 'pending' }, { $set: { status: 'active' } });
      } else {
        await membersCol.deleteOne({ groupId, discordId: targetId, status: 'pending' });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Acción inválida' }, { status: 400 });
  } catch (error) {
    console.error('Error gestionando membresía de grupo:', error);
    return NextResponse.json({ success: false, error: 'No se pudo procesar' }, { status: 500 });
  }
}
