import type { Collection } from 'mongodb';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { currentDiscordUser, resolvePlayerIdentity } from '@/lib/whitelistServer';

export interface CasinoBet {
  id: string;
  playerId: string;
  game: 'roulette' | 'slots' | 'dice';
  bet: number;
  choice: string;
  result: string;
  payout: number;
  net: number;
  createdAt: Date;
}

export async function currentCasinoUser(): Promise<{ id: string; username: string; displayName: string; avatar?: string } | null> {
  const user = currentDiscordUser();
  if (!user) return null;
  const discordAvatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
  const identity = await resolvePlayerIdentity(user.id, { username: user.global_name || user.username, avatar: discordAvatar });
  return { id: user.id, ...identity };
}

export async function casinoBetsCollection(): Promise<Collection<CasinoBet>> {
  const db = await connectToDatabase();
  const col = db.collection<CasinoBet>('casino_bets');
  await col.createIndex({ playerId: 1, createdAt: -1 }).catch(() => {});
  return col;
}

export function newBetId() {
  return crypto.randomUUID();
}
