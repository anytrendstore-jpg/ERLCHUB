import type { Collection } from 'mongodb';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { currentDiscordUser } from '@/lib/whitelistServer';

export interface NotificationDoc {
  id: string;
  discordId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  appId?: string;
  /** A dónde navega la campanita del sitio principal al hacer click (ej. "/whitelist/espera", "/soporte"). */
  link?: string;
  read: boolean;
  timestamp: Date;
}

export async function currentNotificationsUser(): Promise<{ id: string } | null> {
  const user = currentDiscordUser();
  if (!user) return null;
  return { id: user.id };
}

export async function notificationsCollection(): Promise<Collection<NotificationDoc>> {
  const db = await connectToDatabase();
  const col = db.collection<NotificationDoc>('os_notifications');
  await col.createIndex({ discordId: 1, timestamp: -1 }).catch(() => {});
  return col;
}

/** Crea una notificación para un usuario. Usada por otras apps del servidor (marketplace, MDT, etc)
 * y también por eventos del sitio principal (whitelist, tickets, descuentos). */
export async function notifyUser(discordId: string, notif: { title: string; message: string; type?: NotificationDoc['type']; appId?: string; link?: string }): Promise<NotificationDoc> {
  const col = await notificationsCollection();
  const doc: NotificationDoc = {
    id: crypto.randomUUID(),
    discordId,
    title: notif.title,
    message: notif.message,
    type: notif.type || 'info',
    appId: notif.appId,
    link: notif.link,
    read: false,
    timestamp: new Date(),
  };
  await col.insertOne(doc);
  return doc;
}

/** Notifica a TODOS los usuarios registrados de una — para avisos generales (ej. un nuevo
 * descuento). Un insertMany en vez de N llamadas a notifyUser para no hacer N round-trips. */
export async function notifyAllUsers(notif: { title: string; message: string; type?: NotificationDoc['type']; appId?: string; link?: string }): Promise<number> {
  const db = await connectToDatabase();
  const userIds = await db.collection('users').find({}, { projection: { discordId: 1 } }).toArray();
  if (userIds.length === 0) return 0;

  const col = await notificationsCollection();
  const now = new Date();
  const docs: NotificationDoc[] = userIds
    .filter((u) => u.discordId)
    .map((u) => ({
      id: crypto.randomUUID(),
      discordId: u.discordId as string,
      title: notif.title,
      message: notif.message,
      type: notif.type || 'info',
      appId: notif.appId,
      link: notif.link,
      read: false,
      timestamp: now,
    }));
  if (docs.length === 0) return 0;
  await col.insertMany(docs);
  return docs.length;
}
