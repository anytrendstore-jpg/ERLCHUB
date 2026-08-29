import type { Collection } from 'mongodb';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';

/**
 * Tracking real y acotado para el funnel de la tienda (Hub Coins, membresías, kits) — nada de
 * fingerprinting ni geo-IP. `sessionId` es un id anónimo generado en el navegador (sessionStorage,
 * se pierde al cerrar la pestaña), `device` sale de parsear el User-Agent server-side (sin
 * librerías de terceros) y `trafficSource` sale de `document.referrer`, mandado una sola vez por
 * sesión. Ningún campo identifica a una persona real salvo `discordId`, que solo se guarda si el
 * usuario ya inició sesión (mismo criterio que el resto del sitio).
 */
export type StoreEventType = 'page_view' | 'select_package' | 'checkout_start';
export type StoreCategory = 'hub-coins' | 'membership' | 'kit';
export type DeviceType = 'desktop' | 'mobile' | 'tablet';
export type TrafficSource = 'direct' | 'discord' | 'search' | 'social' | 'referral';

export interface StoreEventDoc {
  id: string;
  sessionId: string;
  type: StoreEventType;
  category: StoreCategory;
  catalogId?: string;
  discordId?: string;
  device: DeviceType;
  trafficSource?: TrafficSource;
  path: string;
  timestamp: Date;
}

export async function storeEventsCollection(): Promise<Collection<StoreEventDoc>> {
  const db = await connectToDatabase();
  const col = db.collection<StoreEventDoc>('store_events');
  await col.createIndex({ type: 1, category: 1, timestamp: -1 }).catch(() => {});
  await col.createIndex({ sessionId: 1 }).catch(() => {});
  return col;
}

export function deviceFromUserAgent(ua: string | null): DeviceType {
  if (!ua) return 'desktop';
  const s = ua.toLowerCase();
  if (/ipad|tablet(?!.*mobile)/.test(s)) return 'tablet';
  if (/mobi|android(?!.*tablet)|iphone/.test(s)) return 'mobile';
  return 'desktop';
}

/** Clasifica document.referrer en un puñado de fuentes — no guarda la URL completa (podría traer
 * un query string con datos de otro sitio), solo a qué categoría pertenece. */
export function bucketTrafficSource(referrer: string | undefined, siteHost: string): TrafficSource | undefined {
  if (!referrer) return 'direct';
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    if (host === siteHost.replace(/^www\./, '')) return undefined; // navegación interna, no cuenta como "fuente"
    if (/discord/.test(host)) return 'discord';
    if (/google|bing|duckduckgo|yahoo/.test(host)) return 'search';
    if (/instagram|tiktok|youtube|twitter|x\.com|facebook/.test(host)) return 'social';
    return 'referral';
  } catch {
    return 'direct';
  }
}

export async function recordStoreEvent(input: {
  sessionId: string;
  type: StoreEventType;
  category: StoreCategory;
  catalogId?: string;
  discordId?: string;
  device: DeviceType;
  trafficSource?: TrafficSource;
  path: string;
}): Promise<void> {
  const col = await storeEventsCollection();
  const doc: StoreEventDoc = {
    id: crypto.randomUUID(),
    ...input,
    timestamp: new Date(),
  };
  await col.insertOne(doc);
}
