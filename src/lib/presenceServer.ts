import type { Collection } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';

/**
 * Presencia real de visitantes por página — usado para mostrar "X personas viendo esto ahora"
 * en la tienda. Deliberadamente NO es un número inventado: cada sesión activa manda un ping
 * cada ~20s (ver usePresence.ts) y se cuenta cuántas siguen "vivas" (ping en los últimos 45s).
 * Si nadie más está mirando, esto muestra 1 (o 0), no un número inflado — ver la nota de la
 * sesión sobre no fabricar indicadores de actividad/urgencia falsos.
 */
interface PresenceDoc {
  sessionId: string;
  page: string;
  updatedAt: Date;
}

const ACTIVE_WINDOW_MS = 45 * 1000;

export async function presenceCollection(): Promise<Collection<PresenceDoc>> {
  const db = await connectToDatabase();
  const col = db.collection<PresenceDoc>('page_presence');
  await col.createIndex({ sessionId: 1, page: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ updatedAt: 1 }, { expireAfterSeconds: 120 }).catch(() => {});
  return col;
}

export async function recordPresence(sessionId: string, page: string): Promise<void> {
  const col = await presenceCollection();
  await col.updateOne({ sessionId, page }, { $set: { updatedAt: new Date() } }, { upsert: true });
}

export async function countActive(page: string): Promise<number> {
  const col = await presenceCollection();
  return col.countDocuments({ page, updatedAt: { $gte: new Date(Date.now() - ACTIVE_WINDOW_MS) } });
}
