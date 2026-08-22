import type { Collection } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { currentDiscordUser } from '@/lib/whitelistServer';

/** Se considera "conectado" a un canal si tuvo actividad en los últimos N ms (coincide con el intervalo de poll del cliente). */
export const RADIO_ONLINE_WINDOW_MS = 25000;

export interface RadioPresence {
  discordId: string;
  username: string;
  channelId: string | null;
  lastSeen: Date;
}

export interface RadioMessage {
  id: string;
  channelId: string;
  discordId: string;
  username: string;
  text: string;
  createdAt: Date;
}

export function currentRadioUser(): { id: string; username: string } | null {
  const user = currentDiscordUser();
  if (!user) return null;
  return { id: user.id, username: user.global_name || user.username };
}

export async function radioPresenceCollection(): Promise<Collection<RadioPresence>> {
  const db = await connectToDatabase();
  const col = db.collection<RadioPresence>('radio_presence');
  await col.createIndex({ discordId: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ channelId: 1, lastSeen: -1 }).catch(() => {});
  return col;
}

export async function radioMessagesCollection(): Promise<Collection<RadioMessage>> {
  const db = await connectToDatabase();
  const col = db.collection<RadioMessage>('radio_messages');
  await col.createIndex({ channelId: 1, createdAt: -1 }).catch(() => {});
  return col;
}
