import type { Collection, ClientSession } from 'mongodb';
import crypto from 'crypto';
import { connectToDatabase, getMongoClient, supportsTransactions } from '@/lib/mongodb';
import { usersCollection, hubPayTransactionsCollection, getBalance, getHubPayFreeze, adjustBalance, type HubPayTransactionDoc } from '@/lib/hubPayServer';

/** Efectivo — separado de `hubPayBalance` (banco) a propósito: mismo criterio que ya usa el proyecto para no mezclar dineros de fuentes distintas en un solo campo. */
export interface CashTransactionDoc {
  id: string;
  userId: string;
  amount: number;
  type: 'cash_in' | 'cash_out' | 'starting_grant' | 'expense' | 'income';
  description: string;
  counterpartyId?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
}

export async function cashTransactionsCollection(): Promise<Collection<CashTransactionDoc>> {
  const db = await connectToDatabase();
  const col = db.collection<CashTransactionDoc>('hubpay_cash_transactions');
  await col.createIndex({ userId: 1, timestamp: -1 }).catch(() => {});
  return col;
}

export async function getCashBalance(discordId: string): Promise<number> {
  const col = await usersCollection();
  const doc = await col.findOne({ discordId });
  return (doc?.cashBalance as number) || 0;
}

/** Mismo patrón que adjustBalance() en hubPayServer.ts — único camino de escritura para efectivo. */
export async function adjustCash(entry: {
  discordId: string;
  delta: number;
  type: CashTransactionDoc['type'];
  description: string;
  counterpartyId?: string;
  metadata?: Record<string, unknown>;
}, session?: ClientSession): Promise<CashTransactionDoc> {
  const usersCol = await usersCollection();
  await usersCol.updateOne(
    { discordId: entry.discordId },
    { $inc: { cashBalance: entry.delta }, $setOnInsert: { discordId: entry.discordId } },
    { upsert: true, session }
  );

  const tx: CashTransactionDoc = {
    id: crypto.randomUUID(),
    userId: entry.discordId,
    amount: entry.delta,
    type: entry.type,
    description: entry.description,
    counterpartyId: entry.counterpartyId,
    metadata: entry.metadata,
    timestamp: new Date(),
    status: 'completed',
  };
  const txCol = await cashTransactionsCollection();
  await txCol.insertOne(tx, { session });
  return tx;
}

interface MoveResult { cashTx: CashTransactionDoc; bankTx: HubPayTransactionDoc }

/**
 * Efectivo -> Banco. Si el servidor de Mongo soporta transacciones reales (Atlas en producción),
 * las dos escrituras (débito de efectivo, crédito de banco) van adentro de session.withTransaction():
 * todo-o-nada real, Mongo revierte solo si cualquier paso falla. Si el servidor es standalone
 * (típico en desarrollo local, sin replica set), degrada al mismo patrón ya aceptado en el resto
 * del código: resta primero, suma después, con una reversión de mejor esfuerzo si el segundo paso
 * falla — ver supportsTransactions() en mongodb.ts para el porqué de esta detección.
 */
export async function moveCashToBank(discordId: string, amount: number, description = 'Depósito a la cuenta bancaria'): Promise<MoveResult> {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('El monto debe ser mayor a cero');
  const freeze = await getHubPayFreeze(discordId);
  if (freeze.frozen) throw new Error(freeze.reason || 'Cuenta congelada por Staff');

  const cashBalance = await getCashBalance(discordId);
  if (cashBalance < amount) throw new Error('Efectivo insuficiente');

  if (await supportsTransactions()) {
    const client = await getMongoClient();
    const session = client.startSession();
    try {
      let result!: MoveResult;
      await session.withTransaction(async () => {
        const usersCol = await usersCollection();
        const fresh = await usersCol.findOne({ discordId }, { session });
        if (((fresh?.cashBalance as number) || 0) < amount) throw new Error('Efectivo insuficiente');
        const cashTx = await adjustCash({ discordId, delta: -amount, type: 'cash_out', description }, session);
        const bankTx = await adjustBalance({ discordId, delta: amount, type: 'deposit', description }, session);
        result = { cashTx, bankTx };
      });
      return result;
    } finally {
      await session.endSession();
    }
  }

  const cashTx = await adjustCash({ discordId, delta: -amount, type: 'cash_out', description });
  try {
    const bankTx = await adjustBalance({ discordId, delta: amount, type: 'deposit', description });
    return { cashTx, bankTx };
  } catch (error) {
    await adjustCash({ discordId, delta: amount, type: 'cash_in', description: 'Reversión automática — depósito fallido' }).catch(() => {});
    throw error;
  }
}

/** Banco -> Efectivo. Mismo patrón transaccional espejado. */
export async function moveBankToCash(discordId: string, amount: number, description = 'Retiro de la cuenta bancaria'): Promise<MoveResult> {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('El monto debe ser mayor a cero');
  const freeze = await getHubPayFreeze(discordId);
  if (freeze.frozen) throw new Error(freeze.reason || 'Cuenta congelada por Staff');

  const bankBalance = await getBalance(discordId);
  if (bankBalance < amount) throw new Error('Saldo bancario insuficiente');

  if (await supportsTransactions()) {
    const client = await getMongoClient();
    const session = client.startSession();
    try {
      let result!: MoveResult;
      await session.withTransaction(async () => {
        const usersCol = await usersCollection();
        const fresh = await usersCol.findOne({ discordId }, { session });
        if (((fresh?.hubPayBalance as number) || 0) < amount) throw new Error('Saldo bancario insuficiente');
        const bankTx = await adjustBalance({ discordId, delta: -amount, type: 'withdrawal', description }, session);
        const cashTx = await adjustCash({ discordId, delta: amount, type: 'cash_in', description }, session);
        result = { cashTx, bankTx };
      });
      return result;
    } finally {
      await session.endSession();
    }
  }

  const bankTx = await adjustBalance({ discordId, delta: -amount, type: 'withdrawal', description });
  try {
    const cashTx = await adjustCash({ discordId, delta: amount, type: 'cash_in', description });
    return { cashTx, bankTx };
  } catch (error) {
    await adjustBalance({ discordId, delta: amount, type: 'deposit', description: 'Reversión automática — retiro fallido' }).catch(() => {});
    throw error;
  }
}
