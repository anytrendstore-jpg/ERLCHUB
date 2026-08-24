import { NextRequest, NextResponse } from 'next/server';
import { staffIdentity, logStaffAction } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';
import { socialProfilesCollection } from '@/lib/socialServer';
import type { SocialAccountType } from '@/lib/socialTypes';

export const dynamic = 'force-dynamic';

const ACCOUNT_TYPES: SocialAccountType[] = ['personal', 'business', 'organization'];

/** Lista/busca perfiles de HubSocial para moderación de cuentas. */
export async function GET(request: NextRequest) {
  const denied = await requirePermission('hubsocial.moderate');
  if (denied) return denied;

  try {
    const q = (request.nextUrl.searchParams.get('q') || '').trim();
    const filter = request.nextUrl.searchParams.get('filter') || 'all';

    const query: Record<string, unknown> = {};
    if (filter === 'verified') query.verified = true;
    if (filter === 'suspended') query.suspended = true;
    if (filter === 'business') query.accountType = { $in: ['business', 'organization'] };
    if (q) {
      query.$or = [
        { username: { $regex: q, $options: 'i' } },
        { displayName: { $regex: q, $options: 'i' } },
        { discordId: q },
      ];
    }

    const col = await socialProfilesCollection();
    const docs = await col.find(query).sort({ updatedAt: -1 }).limit(100).toArray();
    return NextResponse.json({ success: true, profiles: docs.map(({ _id, ...p }: any) => p) });
  } catch (error) {
    console.error('Error listando cuentas de HubSocial:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** action: 'verify' | 'unverify' | 'suspend' | 'unsuspend' | 'setAccountType' */
export async function PATCH(request: NextRequest) {
  const denied = await requirePermission('hubsocial.moderate');
  if (denied) return denied;

  try {
    const { discordId, action, reason, accountType, bio, title } = await request.json();
    if (!discordId || !action) return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });

    const col = await socialProfilesCollection();
    const profile = await col.findOne({ discordId });
    if (!profile) return NextResponse.json({ success: false, error: 'Cuenta no encontrada' }, { status: 404 });

    const identity = staffIdentity();
    const actorName = identity?.name || 'Staff';

    if (action === 'verify' || action === 'unverify') {
      await col.updateOne({ discordId }, { $set: { verified: action === 'verify' } });
      await logStaffAction({
        type: 'social_account_verified', category: 'SOCIAL', actor: actorName, actorId: identity?.id,
        target: discordId, description: `${actorName} ${action === 'verify' ? 'verificó' : 'quitó la verificación de'} @${profile.username}`,
      });
    } else if (action === 'suspend' || action === 'unsuspend') {
      await col.updateOne(
        { discordId },
        action === 'suspend'
          ? { $set: { suspended: true, suspendedReason: String(reason || '').trim().slice(0, 300) } }
          : { $set: { suspended: false }, $unset: { suspendedReason: '' } }
      );
      await logStaffAction({
        type: 'social_account_suspended', category: 'SOCIAL', actor: actorName, actorId: identity?.id,
        target: discordId, description: `${actorName} ${action === 'suspend' ? 'suspendió' : 'reactivó'} la cuenta de @${profile.username}`,
      });
    } else if (action === 'setAccountType' && ACCOUNT_TYPES.includes(accountType)) {
      await col.updateOne({ discordId }, { $set: { accountType } });
      await logStaffAction({
        type: 'social_account_type_changed', category: 'SOCIAL', actor: actorName, actorId: identity?.id,
        target: discordId, description: `${actorName} cambió el tipo de cuenta de @${profile.username} a ${accountType}`,
      });
    } else if (action === 'setBio') {
      const trimmed = String(bio || '').trim().slice(0, 160);
      await col.updateOne({ discordId }, { $set: { bio: trimmed } });
      await logStaffAction({
        type: 'social_account_bio_changed', category: 'SOCIAL', actor: actorName, actorId: identity?.id,
        target: discordId, description: `${actorName} cambió la biografía de @${profile.username}`,
      });
    } else if (action === 'setTitle') {
      const trimmed = String(title || '').trim().slice(0, 50);
      await col.updateOne({ discordId }, { $set: { title: trimmed } });
      await logStaffAction({
        type: 'social_account_bio_changed', category: 'SOCIAL', actor: actorName, actorId: identity?.id,
        target: discordId, description: `${actorName} cambió el título de @${profile.username} a "${trimmed}"`,
      });
    } else {
      return NextResponse.json({ success: false, error: 'Acción inválida' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error moderando cuenta de HubSocial:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}
