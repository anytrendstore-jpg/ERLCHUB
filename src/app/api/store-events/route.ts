import { NextRequest, NextResponse } from 'next/server';
import { currentDiscordUser } from '@/lib/whitelistServer';
import {
  recordStoreEvent,
  deviceFromUserAgent,
  bucketTrafficSource,
  type StoreEventType,
  type StoreCategory,
} from '@/lib/storeEventsServer';

export const dynamic = 'force-dynamic';

const TYPES: StoreEventType[] = ['page_view', 'select_package', 'checkout_start'];
const CATEGORIES: StoreCategory[] = ['hub-coins', 'membership', 'kit'];

/** Recibe eventos anónimos del funnel de la tienda. No requiere sesión — si el usuario ya inició
 * sesión con Discord se guarda su id (para que el staff pueda ver "quién" además de "cuánto",
 * igual que ya pueden ver cualquier otra compra suya), si no queda anónimo. */
export async function POST(request: NextRequest) {
  try {
    const { type, category, catalogId, sessionId, path, referrer } = await request.json();

    if (!TYPES.includes(type) || !CATEGORIES.includes(category) || !sessionId || typeof path !== 'string') {
      return NextResponse.json({ success: false, error: 'Evento inválido' }, { status: 400 });
    }

    const user = currentDiscordUser();
    const device = deviceFromUserAgent(request.headers.get('user-agent'));
    const host = request.headers.get('host') || 'erlchub.pro';
    const trafficSource = type === 'page_view' ? bucketTrafficSource(referrer, host) : undefined;

    await recordStoreEvent({
      sessionId: String(sessionId).slice(0, 100),
      type,
      category,
      catalogId: typeof catalogId === 'string' ? catalogId.slice(0, 100) : undefined,
      discordId: user?.id,
      device,
      trafficSource,
      path: path.slice(0, 200),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error registrando evento de tienda:', error);
    return NextResponse.json({ success: false, error: 'No se pudo registrar el evento' }, { status: 500 });
  }
}
