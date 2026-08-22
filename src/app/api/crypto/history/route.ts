import { NextResponse } from 'next/server';
import { currentCryptoUser, cryptoTransactionsCollection } from '@/lib/cryptoServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentCryptoUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await cryptoTransactionsCollection();
    const docs = await col.find({ discordId: me.id }).sort({ createdAt: -1 }).limit(100).toArray();
    return NextResponse.json({ success: true, transactions: docs.map(({ _id, ...t }: any) => t) });
  } catch (error) {
    console.error('Error leyendo historial cripto:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
