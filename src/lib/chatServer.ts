import type { Collection } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { currentDiscordUser, resolvePlayerIdentity } from '@/lib/whitelistServer';
import type { ChatConversation, ChatMessage, ChatPresence, ChatPhoneNumber } from '@/lib/chatTypes';

export const CHAT_ONLINE_WINDOW_MS = 25000;
export const CHAT_TYPING_WINDOW_MS = 6000;

/** username = Roblox verificado (@handle) · displayName = nombre del personaje (RP). */
export async function currentChatUser(): Promise<{ id: string; username: string; displayName: string; avatar?: string } | null> {
  const user = currentDiscordUser();
  if (!user) return null;
  const discordAvatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
  const identity = await resolvePlayerIdentity(user.id, { username: user.global_name || user.username, avatar: discordAvatar });
  return { id: user.id, ...identity };
}

export async function chatConversationsCollection(): Promise<Collection<ChatConversation>> {
  const db = await connectToDatabase();
  const col = db.collection<ChatConversation>('chat_conversations');
  await col.createIndex({ participants: 1, updatedAt: -1 }).catch(() => {});
  return col;
}

export async function chatMessagesCollection(): Promise<Collection<ChatMessage>> {
  const db = await connectToDatabase();
  const col = db.collection<ChatMessage>('chat_messages');
  await col.createIndex({ conversationId: 1, createdAt: 1 }).catch(() => {});
  return col;
}

export async function chatPresenceCollection(): Promise<Collection<ChatPresence>> {
  const db = await connectToDatabase();
  const col = db.collection<ChatPresence>('chat_presence');
  await col.createIndex({ discordId: 1 }, { unique: true }).catch(() => {});
  return col;
}

export async function touchChatPresence(discordId: string) {
  const col = await chatPresenceCollection();
  await col.updateOne({ discordId }, { $set: { discordId, lastSeen: new Date() } }, { upsert: true });
}

export async function chatPhoneNumbersCollection(): Promise<Collection<ChatPhoneNumber>> {
  const db = await connectToDatabase();
  const col = db.collection<ChatPhoneNumber>('chat_phone_numbers');
  await col.createIndex({ discordId: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ phoneNumber: 1 }, { unique: true }).catch(() => {});
  return col;
}

function randomPhoneNumber(): string {
  const part = () => Math.floor(1000 + Math.random() * 9000);
  return `555-${part()}`;
}

/** Devuelve el número de teléfono del jugador (lo genera y lo fija la primera vez que se pide). */
export async function ensurePhoneNumber(discordId: string): Promise<string> {
  const col = await chatPhoneNumbersCollection();
  const existing = await col.findOne({ discordId });
  if (existing) return existing.phoneNumber;

  for (let attempt = 0; attempt < 10; attempt++) {
    const phoneNumber = randomPhoneNumber();
    try {
      await col.insertOne({ discordId, phoneNumber, createdAt: new Date() });
      return phoneNumber;
    } catch {
      // Número duplicado (muy improbable): reintenta con otro.
    }
  }
  throw new Error('No se pudo generar un número de teléfono único');
}
