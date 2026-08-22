import { NextResponse } from 'next/server';
import {
  currentBankUser,
  getBalance,
  getHubCoinsBalance,
  getHubPayFreeze,
  hubPayTransactionsCollection,
  hubPayPocketsCollection,
  hubPayCardsCollection,
  hubPayAccountsCollection,
} from '@/lib/hubPayServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentBankUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const [balance, hubCoins, freeze, txCol, pocketsCol, cardsCol, accountsCol] = await Promise.all([
      getBalance(me.id),
      getHubCoinsBalance(me.id),
      getHubPayFreeze(me.id),
      hubPayTransactionsCollection(),
      hubPayPocketsCollection(),
      hubPayCardsCollection(),
      hubPayAccountsCollection(),
    ]);

    const [transactions, pockets, cards, accounts] = await Promise.all([
      txCol.find({ userId: me.id }).sort({ timestamp: -1 }).limit(100).toArray(),
      pocketsCol.find({ discordId: me.id }).toArray(),
      cardsCol.find({ discordId: me.id }).toArray(),
      accountsCol.find({ discordId: me.id }).toArray(),
    ]);

    const retained = pockets.reduce((sum, p) => sum + (p.isLocked ? p.balance : 0), 0);

    return NextResponse.json({
      success: true,
      wallet: {
        availableBalance: balance,
        hubCoinsBalance: hubCoins,
        retainedBalance: retained,
        totalBalance: balance + pockets.reduce((s, p) => s + p.balance, 0),
        frozen: freeze.frozen,
        frozenReason: freeze.reason,
        transactions: transactions.map(({ _id, ...t }: any) => t),
        pockets: pockets.map(({ _id, ...p }: any) => p),
        cards: cards.map(({ _id, ...c }: any) => c),
        accounts: accounts.map(({ _id, ...a }: any) => a),
      },
    });
  } catch (error) {
    console.error('Error leyendo billetera de HubPay:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
