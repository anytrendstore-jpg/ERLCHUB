import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentSocialUser, isSocialSuspended } from '@/lib/socialServer';
import { mdtCallsCollection } from '@/lib/mdtServer';
import type { CallType, CallPriority, EmergencyFaction } from '@/lib/mdtTypes';

export const dynamic = 'force-dynamic';

const VALID_TYPES: CallType[] = [
  'Traffic Stop', 'Suspicious Activity', 'Robbery', 'Assault', 'Shots Fired',
  'Welfare Check', 'Disturbance', 'Traffic Accident', 'Cyber Crime', 'Other',
];
const VALID_FACTIONS: EmergencyFaction[] = ['Policía', 'Sheriff', 'Bomberos'];

/** El ciudadano nunca elige prioridad — se infiere del tipo de incidente, igual que en una central real. */
const PRIORITY_BY_TYPE: Record<CallType, CallPriority> = {
  'Shots Fired': 'Emergency',
  'Robbery': 'Emergency',
  'Assault': 'High',
  'Traffic Accident': 'High',
  'Disturbance': 'Medium',
  'Suspicious Activity': 'Medium',
  'Welfare Check': 'Medium',
  'Traffic Stop': 'Low',
  'Cyber Crime': 'Low',
  'Other': 'Medium',
};

/** GET: solo las llamadas que hizo el usuario logueado — "Mis llamadas". */
export async function GET() {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await mdtCallsCollection();
    const docs = await col.find({ callerId: user.id, source: 'citizen' }).sort({ createdAt: -1 }).limit(50).toArray();
    return NextResponse.json({ success: true, calls: docs.map(({ _id, ...c }: any) => c) });
  } catch (error) {
    console.error('Error listando llamadas del 911:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con el servidor' }, { status: 500 });
  }
}

/** POST: un jugador reporta una emergencia — cae directo en el mismo tablero de despacho que usan los oficiales. */
export async function POST(request: NextRequest) {
  const user = await currentSocialUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  if (await isSocialSuspended(user.id)) {
    return NextResponse.json({ success: false, error: 'Tu cuenta está suspendida y no puede reportar emergencias' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const type: CallType = VALID_TYPES.includes(body.type) ? body.type : 'Other';
    const faction: EmergencyFaction = VALID_FACTIONS.includes(body.faction) ? body.faction : 'Policía';
    const location = String(body.location || '').trim().slice(0, 200);
    const description = String(body.description || '').trim().slice(0, 1000);
    const anonymous = Boolean(body.anonymous);

    if (!location || !description) {
      return NextResponse.json({ success: false, error: 'Falta la ubicación o la descripción' }, { status: 400 });
    }

    const now = new Date();
    const col = await mdtCallsCollection();
    const count = await col.countDocuments();

    const doc = {
      id: crypto.randomUUID(),
      callNumber: String(5480 + count + 1),
      type,
      priority: PRIORITY_BY_TYPE[type],
      status: 'Pending' as const,
      location,
      description,
      caller: anonymous ? 'Ciudadano anónimo' : user.displayName,
      callerId: user.id,
      faction,
      anonymous,
      source: 'citizen' as const,
      assignedUnits: [],
      createdAt: now,
      updatedAt: now,
      notes: [],
    };
    await col.insertOne(doc as any);

    return NextResponse.json({ success: true, call: doc });
  } catch (error) {
    console.error('Error creando llamada del 911:', error);
    return NextResponse.json({ success: false, error: 'No se pudo enviar la llamada' }, { status: 500 });
  }
}
