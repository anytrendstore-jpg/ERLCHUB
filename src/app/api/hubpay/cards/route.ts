import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentBankUser, hubPayCardsCollection } from '@/lib/hubPayServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const me = await currentBankUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { color } = await request.json();
    const cardNumber = Array(4).fill(0).map(() => Math.floor(1000 + Math.random() * 9000)).join(' ');

    const col = await hubPayCardsCollection();
    const doc = {
      id: crypto.randomUUID(),
      discordId: me.id,
      cardNumber,
      type: 'debit' as const,
      expiryDate: `${String(Math.floor(1 + Math.random() * 12)).padStart(2, '0')}/${String(new Date().getFullYear() + 4).slice(-2)}`,
      cvv: String(Math.floor(100 + Math.random() * 900)),
      status: 'active' as const,
      lastFourDigits: cardNumber.slice(-4),
      cardHolder: me.displayName.toUpperCase(),
      color: color || 'gradient',
      createdAt: new Date(),
    };
    await col.insertOne(doc);

    return NextResponse.json({ success: true, card: doc });
  } catch (error) {
    console.error('Error creando tarjeta:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear' }, { status: 500 });
  }
}

/** action: 'freeze' | 'delete' */
export async function PATCH(request: NextRequest) {
  const me = await currentBankUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { cardId, action } = await request.json();
    const col = await hubPayCardsCollection();
    const card = await col.findOne({ id: cardId, discordId: me.id });
    if (!card) return NextResponse.json({ success: false, error: 'Tarjeta no encontrada' }, { status: 404 });

    if (action === 'freeze') {
      await col.updateOne({ id: cardId }, { $set: { status: card.status === 'frozen' ? 'active' : 'frozen' } });
    } else if (action === 'delete') {
      await col.deleteOne({ id: cardId });
    } else {
      return NextResponse.json({ success: false, error: 'Acción inválida' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error actualizando tarjeta:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}
