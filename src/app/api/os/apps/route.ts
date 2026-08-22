import { NextRequest, NextResponse } from 'next/server';
import { osUserPreferencesCollection, currentOSUserId, ensurePreferencesDoc } from '@/lib/osServer';
import { osApps } from '@/lib/osData';

export const dynamic = 'force-dynamic';

/** Apps que ningún jugador puede desinstalar: sin Hub Store no habría forma de volver a instalar nada. */
const PROTECTED_APP_IDS = new Set(['hubstore']);

export async function GET() {
  const discordId = await currentOSUserId();
  if (!discordId) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const doc = await ensurePreferencesDoc(discordId);
    return NextResponse.json({ success: true, installedApps: doc.installedApps, pinnedApps: doc.pinnedApps });
  } catch (error) {
    console.error('Error leyendo apps instaladas:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const discordId = await currentOSUserId();
  if (!discordId) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { action, appId } = await request.json() as { action: 'install' | 'uninstall' | 'pin' | 'unpin'; appId: string };
    if (!['install', 'uninstall', 'pin', 'unpin'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
    }

    const app = osApps.find((a) => a.id === appId);
    if (!app) return NextResponse.json({ success: false, error: 'Aplicación no encontrada' }, { status: 404 });
    if (app.comingSoon) return NextResponse.json({ success: false, error: 'Esta aplicación todavía no está disponible' }, { status: 400 });
    if (action === 'uninstall' && PROTECTED_APP_IDS.has(appId)) {
      return NextResponse.json({ success: false, error: 'No puedes desinstalar Hub Store' }, { status: 400 });
    }

    await ensurePreferencesDoc(discordId);
    const col = await osUserPreferencesCollection();

    const updates: Record<'install' | 'uninstall' | 'pin' | 'unpin', object> = {
      install: { $addToSet: { installedApps: appId }, $set: { updatedAt: new Date() } },
      // Desinstalar una app deja de tener sentido si además está anclada a la barra de tareas.
      uninstall: { $pull: { installedApps: appId, pinnedApps: appId }, $set: { updatedAt: new Date() } },
      pin: { $addToSet: { pinnedApps: appId }, $set: { updatedAt: new Date() } },
      unpin: { $pull: { pinnedApps: appId }, $set: { updatedAt: new Date() } },
    };
    await col.updateOne({ discordId }, updates[action]);

    const fresh = await col.findOne({ discordId });
    return NextResponse.json({ success: true, installedApps: fresh?.installedApps || [], pinnedApps: fresh?.pinnedApps || [] });
  } catch (error) {
    console.error('Error actualizando apps instaladas:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}
