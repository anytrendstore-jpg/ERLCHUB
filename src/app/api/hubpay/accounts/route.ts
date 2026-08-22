import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentBankUser, hubPayAccountsCollection } from '@/lib/hubPayServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const me = await currentBankUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { type, alias } = await request.json();
    const accountNumber = `ERLC-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}-${String(Math.floor(1 + Math.random() * 9999)).padStart(4, '0')}`;

    const col = await hubPayAccountsCollection();
    const doc = {
      id: crypto.randomUUID(),
      discordId: me.id,
      accountNumber,
      alias: alias?.trim() || undefined,
      type: type || 'savings',
      status: 'active' as const,
      balance: 0,
      createdAt: new Date(),
    };
    await col.insertOne(doc);

    return NextResponse.json({ success: true, account: doc });
  } catch (error) {
    console.error('Error creando cuenta:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear' }, { status: 500 });
  }
}
