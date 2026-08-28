import type { Collection } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';

/**
 * Suscripciones de membresía — colección `membership_subscriptions`, ya usada por
 * src/app/api/memberships/manage/route.ts pero SIN índices y sin ningún escritor real hasta
 * ahora (el webhook de pagos solo tocaba `users.membership`, nunca esta colección — ver Fase D
 * del plan). Este archivo centraliza el acceso y agrega lo que faltaba: índices, y las dos
 * funciones que unifican la entrega real de pagos con esta colección.
 */
export interface MembershipSubscription {
  userId: string;
  membershipId: string;
  membershipName: string;
  membershipType: 'monthly' | 'permanent';
  status: 'active' | 'expired' | 'cancelled' | 'pending_renewal';
  startDate: Date;
  endDate: Date | null;
  lastPaymentDate: Date;
  nextPaymentDate: Date | null;
  autoRenew: boolean;
  renewalPrice: number;
  transactionId?: string;
  benefits: string[];
  roleIds: string[];
  serverId: string;
  reminderSent: boolean;
  /** Payment Source tokenizado en Wompi — un id de referencia, nunca datos de tarjeta. Presente solo si el usuario habilitó auto-renovación. */
  paymentSourceId?: number;
  /** Intentos de cobro fallidos consecutivos para la renovación actual — se resetea a 0 en cada cobro aprobado. */
  failedRenewalAttempts?: number;
  /** Próximo intento de reintento tras un rechazo (backoff 1/3/7 días) — distinto de nextPaymentDate, que es la fecha de vencimiento real. */
  nextRetryAt?: Date;
}

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const RETRY_BACKOFF_DAYS = [1, 3, 7];
const MAX_RETRY_ATTEMPTS = 3;

export async function membershipSubscriptionsCollection(): Promise<Collection<MembershipSubscription>> {
  const db = await connectToDatabase();
  const col = db.collection<MembershipSubscription>('membership_subscriptions');
  await col.createIndex({ userId: 1, status: 1 }).catch(() => {});
  await col.createIndex({ nextPaymentDate: 1, status: 1, autoRenew: 1 }).catch(() => {});
  return col;
}

export async function getActiveSubscription(userId: string, membershipId?: string): Promise<MembershipSubscription | null> {
  const col = await membershipSubscriptionsCollection();
  return col.findOne({ userId, status: 'active', ...(membershipId ? { membershipId } : {}) });
}

/**
 * Llamado por el webhook de Wompi tras un pago aprobado (compra inicial o renovación). Si ya
 * hay una suscripción activa para este userId+membershipId, la EXTIENDE (renovación real) en
 * vez de crear una fila duplicada; si no existe, la crea. Único camino de escritura para que
 * `membership_subscriptions` deje de estar desconectada de lo que el webhook realmente entrega.
 */
export async function upsertSubscriptionFromPayment(input: {
  userId: string;
  membershipId: string;
  membershipName: string;
  membershipType: 'monthly' | 'permanent';
  renewalPrice: number;
  benefits: string[];
  transactionId?: string;
  paymentSourceId?: number;
}): Promise<MembershipSubscription> {
  const col = await membershipSubscriptionsCollection();
  const now = new Date();
  const existing = await getActiveSubscription(input.userId, input.membershipId);

  const endDate = input.membershipType === 'monthly' ? new Date(now.getTime() + MONTH_MS) : null;
  const nextPaymentDate = input.membershipType === 'monthly' ? new Date(now.getTime() + MONTH_MS) : null;

  if (existing) {
    const update: Partial<MembershipSubscription> = {
      status: 'active',
      lastPaymentDate: now,
      endDate,
      nextPaymentDate,
      transactionId: input.transactionId,
      failedRenewalAttempts: 0,
    };
    if (input.paymentSourceId) update.paymentSourceId = input.paymentSourceId;
    await col.updateOne(
      { userId: input.userId, membershipId: input.membershipId, status: 'active' },
      { $set: update, $unset: { nextRetryAt: '' } }
    );
    return { ...existing, ...update } as MembershipSubscription;
  }

  const doc: MembershipSubscription = {
    userId: input.userId,
    membershipId: input.membershipId,
    membershipName: input.membershipName,
    membershipType: input.membershipType,
    status: 'active',
    startDate: now,
    endDate,
    lastPaymentDate: now,
    nextPaymentDate,
    autoRenew: Boolean(input.paymentSourceId),
    renewalPrice: input.renewalPrice,
    transactionId: input.transactionId,
    benefits: input.benefits,
    roleIds: [],
    serverId: process.env.DISCORD_SERVER_ID || '',
    reminderSent: false,
    paymentSourceId: input.paymentSourceId,
    failedRenewalAttempts: 0,
  };
  await col.insertOne(doc);
  return doc;
}

/** Registra un cobro de renovación fallido — sube el contador y calcula el próximo reintento (backoff 1/3/7 días). Devuelve si ya se agotaron los reintentos. */
export async function recordFailedRenewal(userId: string, membershipId: string): Promise<{ attempts: number; exhausted: boolean }> {
  const col = await membershipSubscriptionsCollection();
  const existing = await col.findOne({ userId, membershipId, status: 'active' });
  const attempts = (existing?.failedRenewalAttempts || 0) + 1;
  const exhausted = attempts >= MAX_RETRY_ATTEMPTS;

  if (!exhausted) {
    const backoffDays = RETRY_BACKOFF_DAYS[attempts - 1] || RETRY_BACKOFF_DAYS[RETRY_BACKOFF_DAYS.length - 1];
    const nextRetryAt = new Date(Date.now() + backoffDays * 86400000);
    await col.updateOne({ userId, membershipId, status: 'active' }, { $set: { failedRenewalAttempts: attempts, nextRetryAt } });
  } else {
    await col.updateOne({ userId, membershipId, status: 'active' }, { $set: { failedRenewalAttempts: attempts, status: 'expired', autoRenew: false } });
  }

  return { attempts, exhausted };
}
