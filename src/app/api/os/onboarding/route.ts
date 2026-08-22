import { NextRequest, NextResponse } from 'next/server';
import { osUserPreferencesCollection, currentOSUserId, ensurePreferencesDoc, CURRENT_TUTORIAL_VERSION } from '@/lib/osServer';

export const dynamic = 'force-dynamic';

/** action: 'complete' (terminó el tutorial) | 'reset' (Settings → "Volver a ejecutar introducción"). */
export async function PATCH(request: NextRequest) {
  const discordId = await currentOSUserId();
  if (!discordId) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { action } = await request.json() as { action: 'complete' | 'reset' };
    if (action !== 'complete' && action !== 'reset') {
      return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
    }

    await ensurePreferencesDoc(discordId);
    const col = await osUserPreferencesCollection();
    const onboarding = action === 'complete'
      ? { completed: true, completedAt: new Date(), tutorialVersion: CURRENT_TUTORIAL_VERSION }
      : { completed: false };
    await col.updateOne({ discordId }, { $set: { onboarding, updatedAt: new Date() } });

    return NextResponse.json({ success: true, onboarding });
  } catch (error) {
    console.error('Error actualizando onboarding:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}
