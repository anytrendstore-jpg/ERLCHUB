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

/** Crea una notificación para un usuario. Usada por otras apps del servidor (marketplace, MDT, etc). */
export async function notifyUser(discordId: string, notif: { title: string; message: string; type?: NotificationDoc['type']; appId?: string }): Promise<NotificationDoc> {
  const col = await notificationsCollection();
  const doc: NotificationDoc = {
    id: crypto.randomUUID(),
    discordId,
    title: notif.title,
    message: notif.message,
    type: notif.type || 'info',
    appId: notif.appId,
    read: false,
    timestamp: new Date(),
  };
  await col.insertOne(doc);
  return doc;
}
