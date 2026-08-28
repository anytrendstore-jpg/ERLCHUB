import type { Collection, ClientSession } from 'mongodb';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { currentDiscordUser, resolvePlayerIdentity } from '@/lib/whitelistServer';

/**
 * HubPay mueve dólares de roleplay (dinero del personaje: sueldos, ventas, multas...),
 * NO HubCoins (la moneda premium comprable con dinero real que usa la tienda/kits).
 * Por eso vive en su propia colección/campo, separado de `users.hubCoins` y `hubcoins_transactions`.
 */
export interface HubPayTransactionDoc {
  id: string;
  userId: string;
  amount: number;
  type: 'salary' | 'transfer_in' | 'transfer_out' | 'withdrawal' | 'deposit' | 'expense' | 'starting_grant';
  description: string;
  counterpartyId?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
}

export interface HubPayPocketDoc {
  id: string;
  discordId: string;
  name: string;
  icon: string;
  color: string;
  balance: number;
  isLocked: boolean;
  goal?: number;
  createdAt: Date;
}

export interface HubPayCardDoc {
  id: string;
  discordId: string;
  cardNumber: string;
  type: 'debit' | 'credit';
  expiryDate: string;
  cvv: string;
  status: 'active' | 'frozen' | 'cancelled';
  lastFourDigits: string;
  cardHolder: string;
  color: 'blue' | 'black' | 'gradient';
  createdAt: Date;
}

export interface HubPayAccountDoc {
  id: string;
  discordId: string;
  accountNumber: string;
  alias?: string;
  type: 'savings' | 'checking' | 'business';
  status: 'active' | 'pending' | 'frozen';
  balance: number;
  createdAt: Date;
}

/** username = Roblox verificado · displayName = nombre del personaje (RP). Igual que HubSocial/HubChat. */
export async function currentBankUser(): Promise<{ id: string; username: string; displayName: string; avatar?: string } | null> {
  const user = currentDiscordUser();
  if (!user) return null;
  const discordAvatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
  const identity = await resolvePlayerIdentity(user.id, { username: user.global_name || user.username, avatar: discordAvatar });
  return { id: user.id, ...identity };
}

export async function usersCollection() {
  const db = await connectToDatabase();
  return db.collection('users');
}

export async function hubPayTransactionsCollection(): Promise<Collection<HubPayTransactionDoc>> {
  const db = await connectToDatabase();
  const col = db.collection<HubPayTransactionDoc>('hubpay_transactions');
  await col.createIndex({ userId: 1, timestamp: -1 }).catch(() => {});
  return col;
}

export async function hubPayPocketsCollection(): Promise<Collection<HubPayPocketDoc>> {
  const db = await connectToDatabase();
  const col = db.collection<HubPayPocketDoc>('hubpay_pockets');
  await col.createIndex({ discordId: 1 }).catch(() => {});
  return col;
}

export async function hubPayCardsCollection(): Promise<Collection<HubPayCardDoc>> {
  const db = await connectToDatabase();
  const col = db.collection<HubPayCardDoc>('hubpay_cards');
  await col.createIndex({ discordId: 1 }).catch(() => {});
  return col;
}

export async function hubPayAccountsCollection(): Promise<Collection<HubPayAccountDoc>> {
  const db = await connectToDatabase();
  const col = db.collection<HubPayAccountDoc>('hubpay_accounts');
  await col.createIndex({ discordId: 1 }).catch(() => {});
  return col;
}

/** Saldo de HubPay (dólares RP) — campo `users.hubPayBalance`, separado de `users.hubCoins`. */
export async function getBalance(discordId: string): Promise<number> {
  const col = await usersCollection();
  const doc = await col.findOne({ discordId });
  return doc?.hubPayBalance || 0;
}

/** Saldo de HubCoins (moneda premium de la tienda) — solo lectura aquí, para mostrarlo también en el banco. */
export async function getHubCoinsBalance(discordId: string): Promise<number> {
  const col = await usersCollection();
  const doc = await col.findOne({ discordId });
  return doc?.hubCoins || 0;
}

/** ¿Esta cuenta de HubPay está congelada por Staff? Bloquea operaciones que gastan/mueven dinero propio. */
export async function getHubPayFreeze(discordId: string): Promise<{ frozen: boolean; reason?: string }> {
  const col = await usersCollection();
  const doc = await col.findOne({ discordId });
  return { frozen: Boolean(doc?.hubPayFrozen), reason: doc?.hubPayFrozenReason };
}

/**
 * Ajusta el saldo de HubPay (delta puede ser negativo) y deja un registro en el ledger.
 * No es una transacción de Mongo real (requeriría un replica set), pero mantiene
 * un único punto de escritura para que el saldo y el historial nunca queden inconsistentes
 * por rutas distintas duplicando esta lógica.
 */
export async function adjustBalance(entry: {
  discordId: string;
  delta: number;
  type: HubPayTransactionDoc['type'];
  description: string;
  counterpartyId?: string;
  metadata?: Record<string, unknown>;
}, session?: ClientSession): Promise<HubPayTransactionDoc> {
  const usersCol = await usersCollection();
  await usersCol.updateOne(
    { discordId: entry.discordId },
    { $inc: { hubPayBalance: entry.delta }, $setOnInsert: { discordId: entry.discordId } },
    { upsert: true, session }
  );

  const tx: HubPayTransactionDoc = {
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
  const txCol = await hubPayTransactionsCollection();
  await txCol.insertOne(tx, { session });
  return tx;
}
