import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser, mdtCitationsCollection } from '@/lib/mdtServer';
import { currentBankUser, getBalance, adjustBalance, getHubPayFreeze } from '@/lib/hubPayServer';
import { notifyUser } from '@/lib/notificationsServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await mdtCitationsCollection();
    const docs = await col.find({}).sort({ issuedAt: -1 }).limit(500).toArray();
    return NextResponse.json({ success: true, citations: docs.map(({ _id, ...c }: any) => c) });
  } catch (error) {
    console.error('Error listando multas:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const body = await request.json();
    const col = await mdtCitationsCollection();
    const count = await col.countDocuments();
    const doc = {
      ...body,
      id: crypto.randomUUID(),
      citationNumber: `CIT-${1000 + count + 1}`,
      issuedAt: new Date(),
    };
    await col.insertOne(doc as any);
    return NextResponse.json({ success: true, citation: doc });
  } catch (error) {
    console.error('Error emitiendo multa:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear' }, { status: 500 });
  }
}

/** action: 'pay' — el propio ciudadano paga su multa con dinero real de HubPay. Sin acción: edición administrativa del oficial (ej. pago en efectivo registrado a mano). */
export async function PATCH(request: NextRequest) {
  const { id, action, ...updates } = await request.json();
  if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

  const col = await mdtCitationsCollection();

  if (action === 'pay') {
    const payer = await currentBankUser();
    if (!payer) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

    try {
      const freeze = await getHubPayFreeze(payer.id);
      if (freeze.frozen) {
        return NextResponse.json({ success: false, error: `Tu cuenta de HubPay está congelada por Staff${freeze.reason ? `: ${freeze.reason}` : ''}` }, { status: 403 });
      }

      const citation = await col.findOne({ id });
      if (!citation) return NextResponse.json({ success: false, error: 'Multa no encontrada' }, { status: 404 });
      if (citation.status === 'Paid') return NextResponse.json({ success: false, error: 'Esta multa ya está pagada' }, { status: 400 });

      const balance = await getBalance(payer.id);
      if (balance < citation.fineAmount) return NextResponse.json({ success: false, error: 'Saldo insuficiente en HubPay' }, { status: 400 });

      await adjustBalance({
        discordId: payer.id,
        delta: -citation.fineAmount,
        type: 'expense',
        description: `Multa ${citation.citationNumber}: ${citation.violation}`,
      });
      await col.updateOne({ id }, { $set: { status: 'Paid' } });

      await notifyUser(payer.id, {
        title: 'Multa pagada',
        message: `Pagaste $${citation.fineAmount.toLocaleString('es-CO')} por "${citation.violation}" (${citation.citationNumber})`,
        type: 'success',
        appId: 'hubpay',
      });

      const fresh = await col.findOne({ id });
      const { _id, ...clean } = fresh as any;
      return NextResponse.json({ success: true, citation: clean });
    } catch (error) {
      console.error('Error pagando multa:', error);
      return NextResponse.json({ success: false, error: 'No se pudo procesar el pago' }, { status: 500 });
    }
  }

  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    await col.updateOne({ id }, { $set: updates });
    const fresh = await col.findOne({ id });
    const { _id, ...clean } = fresh as any;
    return NextResponse.json({ success: true, citation: clean });
  } catch (error) {
    console.error('Error actualizando multa:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}
