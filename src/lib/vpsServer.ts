import type { Collection } from 'mongodb';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { currentDiscordUser, resolvePlayerIdentity } from '@/lib/whitelistServer';
import { notifyUser } from '@/lib/notificationsServer';
import { chargeCrypto, getDefaultCryptoCoin } from '@/lib/cryptoServer';

export interface VpsPlan {
  id: string;
  name: string;
  dailyPrice: number;
  /** 0-100: qué tan protegido queda el jugador en la Deep Web mientras el VPS está activo. */
  securityLevel: number;
  /** Duración de cada período de suscripción, en horas (1, 6, 24, 168, 720...). */
  durationHours: number;
  description: string;
  enabled: boolean;
  order: number;
  createdAt: Date;
  updatedBy?: string;
}

export type VpsStatus = 'inactive' | 'active' | 'expired' | 'cancelled';

export interface VpsSubscription {
  id: string;
  discordId: string;
  planId: string;
  planName: string;
  dailyPrice: number;
  securityLevel: number;
  durationHours: number;
  status: VpsStatus;
  purchasedAt: Date;
  activatedAt?: Date;
  expiresAt?: Date;
  autoRenew: boolean;
  /** Umbrales de aviso ya notificados para esta suscripción ('6h' | '1h' | '10m'), evita duplicados. */
  warningsSent: string[];
}

export const DEFAULT_SUBSCRIPTION_HOURS = 24;

export function formatDurationLabel(hours: number): string {
  if (hours % (24 * 30) === 0 && hours >= 24 * 30) return `${hours / (24 * 30)} mes${hours / (24 * 30) > 1 ? 'es' : ''}`;
  if (hours % (24 * 7) === 0 && hours >= 24 * 7) return `${hours / (24 * 7)} semana${hours / (24 * 7) > 1 ? 's' : ''}`;
  if (hours % 24 === 0 && hours >= 24) return `${hours / 24} día${hours / 24 > 1 ? 's' : ''}`;
  return `${hours} hora${hours > 1 ? 's' : ''}`;
}
const WARNING_THRESHOLDS_MS: { id: string; ms: number }[] = [
  { id: '6h', ms: 6 * 60 * 60 * 1000 },
  { id: '1h', ms: 60 * 60 * 1000 },
  { id: '10m', ms: 10 * 60 * 1000 },
];

export async function currentVpsUser(): Promise<{ id: string; username: string; displayName: string; avatar?: string } | null> {
  const user = currentDiscordUser();
  if (!user) return null;
  const discordAvatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
  const identity = await resolvePlayerIdentity(user.id, { username: user.global_name || user.username, avatar: discordAvatar });
  return { id: user.id, ...identity };
}

export async function vpsPlansCollection(): Promise<Collection<VpsPlan>> {
  const db = await connectToDatabase();
  const col = db.collection<VpsPlan>('vps_plans');
  await col.createIndex({ order: 1 }).catch(() => {});
  await col.createIndex({ name: 1 }, { unique: true }).catch(() => {});
  return col;
}

export async function vpsSubscriptionsCollection(): Promise<Collection<VpsSubscription>> {
  const db = await connectToDatabase();
  const col = db.collection<VpsSubscription>('vps_subscriptions');
  await col.createIndex({ discordId: 1, purchasedAt: -1 }).catch(() => {});
  return col;
}

/**
 * Los valores de precio/seguridad son solo un punto de partida real y editable — no una tabla de
 * planes fija — el staff puede crear, editar o desactivar planes libremente desde su Dashboard.
 */
export async function ensureVpsPlansSeeded(): Promise<Collection<VpsPlan>> {
  const col = await vpsPlansCollection();
  const count = await col.countDocuments();
  if (count > 0) return col;
  // Upsert por name (índice único): dos requests concurrentes viendo count===0 a la vez no deben
  // poder crear el plan semilla duplicado.
  await col.updateOne(
    { name: 'VPS Premium' },
    { $setOnInsert: {
      id: crypto.randomUUID(),
      name: 'VPS Premium',
      dailyPrice: 500000,
      securityLevel: 85,
      durationHours: DEFAULT_SUBSCRIPTION_HOURS,
      description: 'Servicio de protección premium para tu actividad en la Deep Web. Reduce tu exposición mientras está activo.',
      enabled: true,
      order: 0,
      createdAt: new Date(),
      updatedBy: 'Sistema',
    } },
    { upsert: true }
  );
  return col;
}

async function getLatestSubscription(discordId: string): Promise<VpsSubscription | null> {
  const col = await vpsSubscriptionsCollection();
  return col.findOne({ discordId }, { sort: { purchasedAt: -1 } });
}

/**
 * Punto único de verdad del estado del VPS de un jugador: revisa expiración, dispara avisos de
 * tiempo restante y, si corresponde, intenta la renovación automática con saldo real de HubPay.
 * Se llama tanto desde /api/vps/status como desde el poll de notificaciones, para que los avisos
 * lleguen aunque el jugador no tenga VPS Manager abierto.
 */
export async function resolveVpsState(discordId: string): Promise<VpsSubscription | null> {
  let sub = await getLatestSubscription(discordId);
  if (!sub || sub.status !== 'active') return sub;

  const col = await vpsSubscriptionsCollection();
  const now = Date.now();
  const expiresAt = sub.expiresAt ? new Date(sub.expiresAt).getTime() : 0;
  const remaining = expiresAt - now;

  if (remaining <= 0) {
    if (sub.autoRenew) {
      const coin = await getDefaultCryptoCoin();
      const charge = coin ? await chargeCrypto(discordId, coin.id, sub.dailyPrice, `VPS ${sub.planName} — renovación automática`) : { ok: false as const };
      if (charge.ok) {
        await col.updateOne({ id: sub.id }, { $set: { status: 'expired' } });
        const now2 = new Date();
        const durationHours = sub.durationHours || DEFAULT_SUBSCRIPTION_HOURS;
        const renewed: VpsSubscription = {
          id: crypto.randomUUID(), discordId, planId: sub.planId, planName: sub.planName,
          dailyPrice: sub.dailyPrice, securityLevel: sub.securityLevel, durationHours, status: 'active',
          purchasedAt: now2, activatedAt: now2, expiresAt: new Date(now2.getTime() + durationHours * 60 * 60 * 1000),
          autoRenew: true, warningsSent: [],
        };
        await col.insertOne(renewed);
        await notifyUser(discordId, { title: 'VPS renovado', message: `Tu suscripción a ${sub.planName} se renovó automáticamente por $${sub.dailyPrice.toLocaleString('es-CO')} en ${charge.coinSymbol}`, type: 'success', appId: 'vps' });
        return renewed;
      }
      await col.updateOne({ id: sub.id }, { $set: { status: 'expired' } });
      await notifyUser(discordId, { title: 'No se pudo renovar tu VPS', message: 'La suscripción ha expirado por saldo insuficiente en Crypto Wallet.', type: 'error', appId: 'vps' });
      return { ...sub, status: 'expired' };
    }

    await col.updateOne({ id: sub.id }, { $set: { status: 'expired' } });
    await notifyUser(discordId, { title: 'Tu VPS ha expirado', message: 'Renueva tu suscripción para volver a utilizar el acceso protegido en la Deep Web.', type: 'warning', appId: 'vps' });
    return { ...sub, status: 'expired' };
  }

  const crossed = WARNING_THRESHOLDS_MS.find((t) => remaining <= t.ms && !sub!.warningsSent.includes(t.id));
  if (crossed) {
    const label = crossed.id === '6h' ? '6 horas' : crossed.id === '1h' ? '1 hora' : '10 minutos';
    await notifyUser(discordId, { title: 'Tu VPS está por expirar', message: `Tu VPS ${sub.planName} expirará en ${label}.`, type: 'warning', appId: 'vps' });
    await col.updateOne({ id: sub.id }, { $addToSet: { warningsSent: crossed.id } });
    sub = { ...sub, warningsSent: [...sub.warningsSent, crossed.id] };
  }

  return sub;
}
