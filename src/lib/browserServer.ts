import type { Collection } from 'mongodb';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { currentDiscordUser } from '@/lib/whitelistServer';

export interface BrowserHistoryEntry {
  id: string;
  discordId: string;
  url: string;
  title: string;
  visitedAt: Date;
}

export interface BrowserBookmark {
  id: string;
  discordId: string;
  url: string;
  title: string;
  createdAt: Date;
}

export function currentBrowserUserId(): string | null {
  return currentDiscordUser()?.id || null;
}

export async function browserHistoryCollection(): Promise<Collection<BrowserHistoryEntry>> {
  const db = await connectToDatabase();
  const col = db.collection<BrowserHistoryEntry>('browser_history');
  await col.createIndex({ discordId: 1, visitedAt: -1 }).catch(() => {});
  return col;
}

export async function browserBookmarksCollection(): Promise<Collection<BrowserBookmark>> {
  const db = await connectToDatabase();
  const col = db.collection<BrowserBookmark>('browser_bookmarks');
  await col.createIndex({ discordId: 1, url: 1 }, { unique: true }).catch(() => {});
  return col;
}

export { crypto };
