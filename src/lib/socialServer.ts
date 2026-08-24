import type { Collection } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { currentDiscordUser, resolvePlayerIdentity } from '@/lib/whitelistServer';
import type { SocialPost, SocialProfile, SocialFollow, SocialStory, SocialReport } from '@/lib/socialTypes';
import type { SocialPage } from '@/lib/socialPageTypes';
import type { SocialGroup, SocialGroupMember } from '@/lib/socialGroupTypes';
import type { SocialEvent } from '@/lib/socialEventTypes';

/** username = Roblox verificado (@handle) · displayName = nombre del personaje (RP). */
export async function currentSocialUser(): Promise<{ id: string; username: string; displayName: string; avatar?: string } | null> {
  const user = currentDiscordUser();
  if (!user) return null;
  const discordAvatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
  const identity = await resolvePlayerIdentity(user.id, { username: user.global_name || user.username, avatar: discordAvatar });
  return { id: user.id, ...identity };
}

/** ¿Esta cuenta está suspendida por staff? Bloquea publicar/comentar/reaccionar, no la lectura. */
export async function isSocialSuspended(discordId: string): Promise<boolean> {
  const col = await socialProfilesCollection();
  const profile = await col.findOne({ discordId });
  return Boolean(profile?.suspended);
}

export async function socialPostsCollection(): Promise<Collection<SocialPost>> {
  const db = await connectToDatabase();
  const col = db.collection<SocialPost>('social_posts');
  await col.createIndex({ createdAt: -1 }).catch(() => {});
  return col;
}

export async function socialProfilesCollection(): Promise<Collection<SocialProfile>> {
  const db = await connectToDatabase();
  const col = db.collection<SocialProfile>('social_profiles');
  await col.createIndex({ discordId: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ username: 'text' }).catch(() => {});
  return col;
}

export async function socialFollowsCollection(): Promise<Collection<SocialFollow>> {
  const db = await connectToDatabase();
  const col = db.collection<SocialFollow>('social_follows');
  await col.createIndex({ followerId: 1, followingId: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ followingId: 1 }).catch(() => {});
  return col;
}

/** Mantiene al día el perfil buscable (username/displayName/avatar) cada vez que el usuario interactúa. No crea bio/cover. */
export async function touchSocialProfile(user: { id: string; username: string; displayName: string; avatar?: string }) {
  const col = await socialProfilesCollection();
  await col.updateOne(
    { discordId: user.id },
    { $set: { discordId: user.id, username: user.username, displayName: user.displayName, avatar: user.avatar, updatedAt: new Date() } },
    { upsert: true }
  );
}

export const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000;

export async function socialStoriesCollection(): Promise<Collection<SocialStory>> {
  const db = await connectToDatabase();
  const col = db.collection<SocialStory>('social_stories');
  await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {});
  await col.createIndex({ discordId: 1, createdAt: -1 }).catch(() => {});
  return col;
}

export async function socialReportsCollection(): Promise<Collection<SocialReport>> {
  const db = await connectToDatabase();
  const col = db.collection<SocialReport>('social_reports');
  await col.createIndex({ status: 1, createdAt: -1 }).catch(() => {});
  return col;
}

export async function socialPagesCollection(): Promise<Collection<SocialPage>> {
  const db = await connectToDatabase();
  const col = db.collection<SocialPage>('social_pages');
  await col.createIndex({ id: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ name: 'text' }).catch(() => {});
  await col.createIndex({ category: 1 }).catch(() => {});
  return col;
}

/** ¿Puede este jugador administrar la página (publicar como ella, editarla)? */
export function isPageAdmin(page: SocialPage, discordId: string): boolean {
  return page.ownerId === discordId || page.admins.includes(discordId);
}

export async function socialGroupsCollection(): Promise<Collection<SocialGroup>> {
  const db = await connectToDatabase();
  const col = db.collection<SocialGroup>('social_groups');
  await col.createIndex({ id: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ name: 'text' }).catch(() => {});
  return col;
}

export async function socialGroupMembersCollection(): Promise<Collection<SocialGroupMember>> {
  const db = await connectToDatabase();
  const col = db.collection<SocialGroupMember>('social_group_members');
  await col.createIndex({ groupId: 1, discordId: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ discordId: 1 }).catch(() => {});
  return col;
}

/** ¿Puede este jugador administrar el grupo (editarlo, aprobar miembros)? */
export function isGroupAdmin(member: SocialGroupMember | null | undefined): boolean {
  return Boolean(member && member.status === 'active' && (member.role === 'owner' || member.role === 'admin'));
}

export async function socialEventsCollection(): Promise<Collection<SocialEvent>> {
  const db = await connectToDatabase();
  const col = db.collection<SocialEvent>('social_events');
  await col.createIndex({ id: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ date: 1 }).catch(() => {});
  return col;
}

/** Límite de publicaciones por jugador en la última hora, para frenar el spam. */
export const POST_RATE_LIMIT = 10;
export const POST_RATE_WINDOW_MS = 60 * 60 * 1000;

export async function isOverPostRateLimit(discordId: string): Promise<boolean> {
  const col = await socialPostsCollection();
  const since = new Date(Date.now() - POST_RATE_WINDOW_MS);
  const count = await col.countDocuments({ discordId, createdAt: { $gte: since } });
  return count >= POST_RATE_LIMIT;
}

const MENTION_REGEX = /@([a-zA-Z0-9_.]{2,32})/g;

/** Extrae @menciones de un texto y devuelve los discordId reales de usuarios existentes (sin incluir a excludeId). */
export async function resolveMentions(text: string, excludeId: string): Promise<{ discordId: string; username: string }[]> {
  const usernames = Array.from(new Set(Array.from(text.matchAll(MENTION_REGEX), (m) => m[1].toLowerCase())));
  if (usernames.length === 0) return [];

  const col = await socialProfilesCollection();
  const profiles = await col.find({ username: { $in: usernames.map((u) => new RegExp(`^${u}$`, 'i')) } }).toArray();
  return profiles.filter((p) => p.discordId !== excludeId).map((p) => ({ discordId: p.discordId, username: p.username }));
}

export async function socialProfileStats(discordId: string) {
  const [postsCol, followsCol] = await Promise.all([socialPostsCollection(), socialFollowsCollection()]);
  const [postsCount, followersCount, followingCount] = await Promise.all([
    postsCol.countDocuments({ discordId }),
    followsCol.countDocuments({ followingId: discordId }),
    followsCol.countDocuments({ followerId: discordId }),
  ]);
  return { postsCount, followersCount, followingCount };
}
