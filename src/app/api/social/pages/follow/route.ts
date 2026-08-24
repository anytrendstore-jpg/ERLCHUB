import { NextRequest, NextResponse } from 'next/server';
import { socialPagesCollection, currentSocialUser } from '@/lib/socialServer';
import { notifyUser } from '@/lib/notificationsServer';

export const dynamic = 'force-dynamic';

/** Toggle seguir/dejar de seguir una página (separado de /api/social/follow porque el
 * target es una página, no un usuario, y vive en su propio arreglo `followers[]`). */
export async function POST(request: NextRequest) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { pageId } = await request.json();
    if (!pageId) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await socialPagesCollection();
    const page = await col.findOne({ id: pageId });
    if (!page) return NextResponse.json({ success: false, error: 'No existe' }, { status: 404 });

    const alreadyFollowing = page.followers.includes(user.id);
    await col.updateOne(
      { id: pageId },
      alreadyFollowing ? { $pull: { followers: user.id } } : { $addToSet: { followers: user.id } }
    );

    if (!alreadyFollowing) {
      await notifyUser(page.ownerId, {
        title: 'Nuevo seguidor de tu página',
        message: `${user.displayName} empezó a seguir ${page.name}`,
        type: 'info',
        appId: 'hubsocial',
      });
    }

    return NextResponse.json({ success: true, following: !alreadyFollowing });
  } catch (error) {
    console.error('Error siguiendo página:', error);
    return NextResponse.json({ success: false, error: 'No se pudo procesar' }, { status: 500 });
  }
}
