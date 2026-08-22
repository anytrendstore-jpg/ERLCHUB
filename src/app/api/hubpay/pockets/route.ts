import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentBankUser, getBalance, adjustBalance, hubPayPocketsCollection } from '@/lib/hubPayServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const me = await currentBankUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { name, icon, color, goal } = await request.json();
    if (!name?.trim()) return NextResponse.json({ success: false, error: 'Falta el nombre' }, { status: 400 });

    const col = await hubPayPocketsCollection();
    const doc = {
      id: crypto.randomUUID(),
      discordId: me.id,
      name: String(name).trim().slice(0, 40),
      icon: icon || 'money',
      color: color || '#3b82f6',
      balance: 0,
      isLocked: false,
      goal: goal ? Number(goal) : undefined,
      createdAt: new Date(),
    };
    await col.insertOne(doc);

    return NextResponse.json({ success: true, pocket: doc });
  } catch (error) {
    console.error('Error creando bolsillo:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear' }, { status: 500 });
  }
}

/** action: 'moveTo' | 'moveFrom' | 'toggleLock' */
export async function PATCH(request: NextRequest) {
  const me = await currentBankUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { pocketId, action, amount } = await request.json();
    const col = await hubPayPocketsCollection();
    const pocket = await col.findOne({ id: pocketId, discordId: me.id });
    if (!pocket) return NextResponse.json({ success: false, error: 'Bolsillo no encontrado' }, { status: 404 });

    if (action === 'toggleLock') {
      await col.updateOne({ id: pocketId }, { $set: { isLocked: !pocket.isLocked } });
      return NextResponse.json({ success: true });
    }

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return NextResponse.json({ success: false, error: 'Monto inválido' }, { status: 400 });

    if (action === 'moveTo') {
      const balance = await getBalance(me.id);
      if (balance < value) return NextResponse.json({ success: false, error: 'Saldo insuficiente' }, { status: 400 });
      await adjustBalance({ discordId: me.id, delta: -value, type: 'transfer_out', description: `A bolsillo "${pocket.name}"` });
      await col.updateOne({ id: pocketId }, { $inc: { balance: value } });
    } else if (action === 'moveFrom') {
      if (pocket.isLocked) return NextResponse.json({ success: false, error: 'El bolsillo está bloqueado' }, { status: 400 });
      if (pocket.balance < value) return NextResponse.json({ success: false, error: 'Saldo insuficiente en el bolsillo' }, { status: 400 });
      await col.updateOne({ id: pocketId }, { $inc: { balance: -value } });
      await adjustBalance({ discordId: me.id, delta: value, type: 'transfer_in', description: `Desde bolsillo "${pocket.name}"` });
    } else {
      return NextResponse.json({ success: false, error: 'Acción inválida' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error actualizando bolsillo:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}
