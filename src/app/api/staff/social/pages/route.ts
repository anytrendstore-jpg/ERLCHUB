import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { staffIdentity, logStaffAction } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';
import { socialPagesCollection } from '@/lib/socialServer';
import type { SocialPageVerificationType } from '@/lib/socialPageTypes';

export const dynamic = 'force-dynamic';

const VERIFICATION_TYPES: SocialPageVerificationType[] = ['business', 'organization', 'government', 'official'];

/** Lista/busca páginas de HubSocial para gestión desde Staff. */
export async function GET(request: NextRequest) {
  const denied = await requirePermission('hubsocial.moderate');
  if (denied) return denied;

  try {
    const q = (request.nextUrl.searchParams.get('q') || '').trim();
    const filter = request.nextUrl.searchParams.get('filter') || 'all';

    const query: Record<string, unknown> = {};
    if (filter === 'verified') query.verified = true;
    if (filter === 'unverified') query.verified = false;
    if (q) query.name = { $regex: q, $options: 'i' };

    const col = await socialPagesCollection();
    const docs = await col.find(query).sort({ createdAt: -1 }).limit(100).toArray();
    return NextResponse.json({
      success: true,
      pages: docs.map(({ _id, ...p }: any) => ({ ...p, followersCount: (p.followers || []).length })),
    });
  } catch (error) {
    console.error('Error listando páginas de HubSocial:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** Staff crea una página oficial directamente (ej. la del propio servidor, LSPD, etc). */
export async function POST(request: NextRequest) {
  const denied = await requirePermission('hubsocial.moderate');
  if (denied) return denied;

  try {
    const { name, category, bio, avatarUrl, verificationType } = await request.json();
    const trimmedName = String(name || '').trim().slice(0, 60);
    const trimmedCategory = String(category || '').trim().slice(0, 40);
    if (!trimmedName || !trimmedCategory) {
      return NextResponse.json({ success: false, error: 'Nombre y categoría son obligatorios' }, { status: 400 });
    }

    const identity = staffIdentity();
    if (!identity) return NextResponse.json({ success: false, error: 'Sin sesión de staff' }, { status: 401 });

    const col = await socialPagesCollection();
    const doc = {
      id: crypto.randomUUID(),
      name: trimmedName,
      category: trimmedCategory,
      bio: bio ? String(bio).trim().slice(0, 300) : undefined,
      avatarUrl: avatarUrl ? String(avatarUrl).trim().slice(0, 1000) : undefined,
      verified: true,
      verificationType: VERIFICATION_TYPES.includes(verificationType) ? verificationType : 'organization',
      ownerId: identity.id,
      admins: [] as string[],
      followers: [] as string[],
      createdAt: new Date(),
    };
    await col.insertOne(doc);

    await logStaffAction({
      type: 'social_page_created', category: 'SOCIAL', actor: identity.name, actorId: identity.id,
      target: doc.id, description: `${identity.name} creó la página oficial "${doc.name}"`,
    });

    return NextResponse.json({ success: true, page: { ...doc, followersCount: 0 } });
  } catch (error) {
    console.error('Error creando página de HubSocial:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear la página' }, { status: 500 });
  }
}

/** action: 'verify' | 'unverify' | 'setVerificationType' | 'addAdmin' | 'removeAdmin' */
export async function PATCH(request: NextRequest) {
  const denied = await requirePermission('hubsocial.moderate');
  if (denied) return denied;

  try {
    const { pageId, action, verificationType, discordId } = await request.json();
    if (!pageId || !action) return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });

    const col = await socialPagesCollection();
    const page = await col.findOne({ id: pageId });
    if (!page) return NextResponse.json({ success: false, error: 'Página no encontrada' }, { status: 404 });

    const identity = staffIdentity();
    const actorName = identity?.name || 'Staff';

    if (action === 'verify' || action === 'unverify') {
      await col.updateOne({ id: pageId }, { $set: { verified: action === 'verify' } });
      await logStaffAction({
        type: 'social_page_verified', category: 'SOCIAL', actor: actorName, actorId: identity?.id,
        target: pageId, description: `${actorName} ${action === 'verify' ? 'verificó' : 'quitó la verificación de'} la página "${page.name}"`,
      });
    } else if (action === 'setVerificationType' && VERIFICATION_TYPES.includes(verificationType)) {
      await col.updateOne({ id: pageId }, { $set: { verificationType } });
      await logStaffAction({
        type: 'social_page_type_changed', category: 'SOCIAL', actor: actorName, actorId: identity?.id,
        target: pageId, description: `${actorName} cambió el tipo de verificación de "${page.name}" a ${verificationType}`,
      });
    } else if (action === 'addAdmin' && discordId) {
      await col.updateOne({ id: pageId }, { $addToSet: { admins: discordId } });
      await logStaffAction({
        type: 'social_page_admin_added', category: 'SOCIAL', actor: actorName, actorId: identity?.id,
        target: pageId, description: `${actorName} agregó a ${discordId} como administrador de "${page.name}"`,
      });
    } else if (action === 'removeAdmin' && discordId) {
      await col.updateOne({ id: pageId }, { $pull: { admins: discordId } });
      await logStaffAction({
        type: 'social_page_admin_removed', category: 'SOCIAL', actor: actorName, actorId: identity?.id,
        target: pageId, description: `${actorName} quitó a ${discordId} como administrador de "${page.name}"`,
      });
    } else {
      return NextResponse.json({ success: false, error: 'Acción inválida' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error gestionando página de HubSocial:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}
