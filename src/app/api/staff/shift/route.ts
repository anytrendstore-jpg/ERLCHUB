import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireStaff, staffIdentity, staffShifts } from '@/lib/staffServer';

export const dynamic = 'force-dynamic';

/** Turno abierto y últimos turnos del staff conectado. */
export async function GET() {
  const denied = requireStaff();
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    if (!identity) return NextResponse.json({ success: false, error: 'Sin identidad de staff' }, { status: 401 });

    const col = await staffShifts();
    const [open, history] = await Promise.all([
      col.findOne({ staffId: identity.id, clockOut: { $exists: false } }),
      col.find({ staffId: identity.id }).sort({ clockIn: -1 }).limit(20).toArray(),
    ]);

    return NextResponse.json({
      success: true,
      open: open ? { ...open, _id: undefined } : null,
      history: history.map(({ _id, ...s }: any) => s),
    });
  } catch (error) {
    console.error('Error leyendo turnos:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** action: 'clock_in' | 'clock_out' */
export async function POST(request: NextRequest) {
  const denied = requireStaff();
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    if (!identity) return NextResponse.json({ success: false, error: 'Sin identidad de staff' }, { status: 401 });

    const { action, notes } = await request.json();
    const col = await staffShifts();

    if (action === 'clock_in') {
      const existing = await col.findOne({ staffId: identity.id, clockOut: { $exists: false } });
      if (existing) return NextResponse.json({ success: false, error: 'Ya tienes un turno abierto' }, { status: 400 });

      const doc = { id: crypto.randomUUID(), staffId: identity.id, staffName: identity.name, clockIn: new Date() };
      await col.insertOne(doc);
      const { _id, ...shift } = doc as typeof doc & { _id?: unknown };
      return NextResponse.json({ success: true, shift });
    }

    if (action === 'clock_out') {
      const existing = await col.findOne({ staffId: identity.id, clockOut: { $exists: false } });
      if (!existing) return NextResponse.json({ success: false, error: 'No tienes un turno abierto' }, { status: 400 });

      await col.updateOne({ id: existing.id }, { $set: { clockOut: new Date(), notes: notes?.trim() || undefined } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('Error registrando turno:', error);
    return NextResponse.json({ success: false, error: 'No se pudo registrar el turno' }, { status: 500 });
  }
}
