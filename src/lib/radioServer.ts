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
  /** Micrófono habilitado en el canal actual — separado de estar sintonizado (texto), ver RadioApp.tsx. */
  voiceEnabled?: boolean;
}

export interface RadioMessage {
  id: string;
  channelId: string;
  discordId: string;
  username: string;
  text: string;
  createdAt: Date;
}

/**
 * Señalización WebRTC para voz por canal — oferta/respuesta/candidatos ICE entre dos
 * peers puntuales. Se consume (se borra) al leerse, y además expira sola (TTL) por si
 * un cliente nunca llega a hacer poll. No transporta audio, solo la negociación inicial:
 * el audio en sí viaja peer-to-peer, nunca pasa por este servidor.
 */
export interface RadioVoiceSignal {
  id: string;
  channelId: string;
  fromId: string;
  fromUsername: string;
  toId: string;
  type: 'offer' | 'answer' | 'ice-candidate' | 'leave';
  payload: unknown;
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

export async function radioVoiceSignalsCollection(): Promise<Collection<RadioVoiceSignal>> {
  const db = await connectToDatabase();
  const col = db.collection<RadioVoiceSignal>('radio_voice_signals');
  await col.createIndex({ toId: 1 }).catch(() => {});
  // TTL: si un cliente nunca hace poll (cerró la pestaña a mitad de negociación), la señal se limpia sola.
  await col.createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 }).catch(() => {});
  return col;
}
