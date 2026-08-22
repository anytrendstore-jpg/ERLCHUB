import { NextRequest, NextResponse } from 'next/server';
import { currentCareerUser, careerProfilesCollection, getOrCreateProfile, areConnected, isBlocked } from '@/lib/hubCareerServer';
import { resolvePlayerIdentity } from '@/lib/whitelistServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const targetId = request.nextUrl.searchParams.get('userId') || me.id;
    const isOwn = targetId === me.id;

    if (!isOwn && await isBlocked(me.id, targetId)) {
      return NextResponse.json({ success: true, profile: null, blocked: true, isOwn: false, isConnected: false });
    }

    const col = await careerProfilesCollection();
    let profile = await col.findOne({ discordId: targetId });

    if (!profile) {
      if (isOwn) {
        profile = await getOrCreateProfile(me);
      } else {
        const identity = await resolvePlayerIdentity(targetId, { username: targetId });
        return NextResponse.json({ success: true, profile: null, displayName: identity.displayName, isOwn: false, isConnected: false });
      }
    }

    const isConnected = isOwn ? true : await areConnected(me.id, targetId);

    if (!isOwn) {
      await col.updateOne({ discordId: targetId }, { $inc: { profileViews: 1 } });

      // Privacidad real: si el dueño restringió el perfil y el visitante no cumple el nivel requerido, no se expone.
      const profileVisibility = profile.privacy?.profile || 'public';
      const canSeeProfile = profileVisibility === 'public' || (profileVisibility === 'connections' && isConnected);
      if (!canSeeProfile) {
        return NextResponse.json({
          success: true, profile: null, restricted: true, isOwn: false, isConnected,
          displayName: profile.displayName, avatar: profile.avatar,
        });
      }

      const expVisibility = profile.privacy?.experience || 'public';
      const canSeeExperience = expVisibility === 'public' || (expVisibility === 'connections' && isConnected);
      if (!canSeeExperience) {
        profile = { ...profile, experience: [], education: [] };
      }
    }

    const { _id, ...clean } = profile as any;
    return NextResponse.json({ success: true, profile: clean, isOwn, isConnected });
  } catch (error) {
    console.error('Error leyendo perfil de HubCareer:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

const EDITABLE_KEYS = ['headline', 'bio', 'location', 'coverImage', 'languages', 'privacy'] as const;

export async function PATCH(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    await getOrCreateProfile(me);
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    for (const key of EDITABLE_KEYS) {
      if (key in body) updates[key] = body[key];
    }
    if (Object.keys(updates).length === 0) return NextResponse.json({ success: false, error: 'Sin cambios' }, { status: 400 });

    const col = await careerProfilesCollection();
    updates.updatedAt = new Date();
    await col.updateOne({ discordId: me.id }, { $set: updates });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error actualizando perfil de HubCareer:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}
