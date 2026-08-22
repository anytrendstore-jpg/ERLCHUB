import type { Collection } from 'mongodb';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { resolvePlayerIdentity } from '@/lib/whitelistServer';
import { notifyUser } from '@/lib/notificationsServer';
import { getConnectionIds } from '@/lib/hubCareerServer';
import { companiesCollection } from '@/lib/hubCareerJobsServer';

/** Feed profesional: publicaciones, comentarios y reacciones. */

export type ReactionType = 'like' | 'support' | 'interesting' | 'congrats' | 'excellent';
export type PostVisibility = 'public' | 'connections' | 'private';
export type PostAuthorType = 'user' | 'company';

export interface CareerPost {
  id: string;
  authorType: PostAuthorType;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  imageUrl?: string;
  linkUrl?: string;
  visibility: PostVisibility;
  reactions: Record<ReactionType, string[]>;
  commentCount: number;
  shareCount: number;
  savedBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CareerComment {
  id: string;
  postId: string;
  parentId?: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  reactions: Record<ReactionType, string[]>;
  createdAt: Date;
}

const EMPTY_REACTIONS: Record<ReactionType, string[]> = { like: [], support: [], interesting: [], congrats: [], excellent: [] };

export async function careerPostsCollection(): Promise<Collection<CareerPost>> {
  const db = await connectToDatabase();
  const col = db.collection<CareerPost>('career_posts');
  await col.createIndex({ createdAt: -1 }).catch(() => {});
  await col.createIndex({ authorId: 1, createdAt: -1 }).catch(() => {});
  return col;
}

export async function careerCommentsCollection(): Promise<Collection<CareerComment>> {
  const db = await connectToDatabase();
  const col = db.collection<CareerComment>('career_comments');
  await col.createIndex({ postId: 1, createdAt: 1 }).catch(() => {});
  return col;
}

export async function createPost(author: { id: string; displayName: string; avatar?: string }, data: { text: string; imageUrl?: string; linkUrl?: string; visibility: PostVisibility; asCompanyId?: string }): Promise<{ ok: boolean; error?: string; post?: CareerPost }> {
  if (!data.text.trim() && !data.imageUrl && !data.linkUrl) return { ok: false, error: 'La publicación no puede estar vacía' };

  let authorType: PostAuthorType = 'user';
  let authorId = author.id;
  let authorName = author.displayName;
  let authorAvatar = author.avatar;

  if (data.asCompanyId) {
    const companiesCol = await companiesCollection();
    const company = await companiesCol.findOne({ id: data.asCompanyId });
    if (!company) return { ok: false, error: 'Empresa no encontrada' };
    if (company.ownerId !== author.id && !company.admins.includes(author.id)) return { ok: false, error: 'No tienes permisos en esta empresa' };
    authorType = 'company';
    authorId = company.id;
    authorName = company.name;
    authorAvatar = company.logo;
  }

  const now = new Date();
  const post: CareerPost = {
    id: crypto.randomUUID(), authorType, authorId, authorName, authorAvatar,
    text: data.text.trim(), imageUrl: data.imageUrl, linkUrl: data.linkUrl, visibility: data.visibility,
    reactions: { ...EMPTY_REACTIONS }, commentCount: 0, shareCount: 0, savedBy: [], createdAt: now, updatedAt: now,
  };
  const col = await careerPostsCollection();
  await col.insertOne(post);
  return { ok: true, post };
}

export async function getFeed(discordId: string, limit = 30): Promise<CareerPost[]> {
  const [connectionIds, companiesCol] = await Promise.all([getConnectionIds(discordId), companiesCollection()]);
  const followedCompanies = await companiesCol.find({ followers: discordId }).project({ id: 1 }).toArray();
  const followedIds = followedCompanies.map((c: any) => c.id);

  const col = await careerPostsCollection();
  const docs = await col.find({
    $or: [
      { authorId: discordId },
      { authorId: { $in: [...connectionIds, ...followedIds] }, visibility: { $in: ['public', 'connections'] } },
      { visibility: 'public' },
    ],
  }).sort({ createdAt: -1 }).limit(limit).toArray();
  return docs;
}

export async function toggleReaction(discordId: string, postId: string, reaction: ReactionType): Promise<{ ok: boolean; error?: string }> {
  const col = await careerPostsCollection();
  const post = await col.findOne({ id: postId });
  if (!post) return { ok: false, error: 'Publicación no encontrada' };

  const hasReacted = post.reactions[reaction]?.includes(discordId);
  const update: any = hasReacted
    ? { $pull: { [`reactions.${reaction}`]: discordId } }
    : { $addToSet: { [`reactions.${reaction}`]: discordId } };
  await col.updateOne({ id: postId }, update);

  if (!hasReacted && post.authorType === 'user' && post.authorId !== discordId) {
    const identity = await resolvePlayerIdentity(discordId, { username: discordId });
    await notifyUser(post.authorId, { title: 'Nueva reacción', message: `${identity.displayName} reaccionó a tu publicación`, type: 'info', appId: 'hubcareer' });
  }
  return { ok: true };
}

export async function addComment(author: { id: string; displayName: string; avatar?: string }, postId: string, text: string, parentId?: string): Promise<{ ok: boolean; error?: string; comment?: CareerComment }> {
  if (!text.trim()) return { ok: false, error: 'El comentario no puede estar vacío' };
  const postsCol = await careerPostsCollection();
  const post = await postsCol.findOne({ id: postId });
  if (!post) return { ok: false, error: 'Publicación no encontrada' };

  const comment: CareerComment = {
    id: crypto.randomUUID(), postId, parentId, authorId: author.id, authorName: author.displayName, authorAvatar: author.avatar,
    text: text.trim(), reactions: { ...EMPTY_REACTIONS }, createdAt: new Date(),
  };
  const col = await careerCommentsCollection();
  await col.insertOne(comment);
  await postsCol.updateOne({ id: postId }, { $inc: { commentCount: 1 } });

  if (post.authorType === 'user' && post.authorId !== author.id) {
    await notifyUser(post.authorId, { title: 'Nuevo comentario', message: `${author.displayName} comentó tu publicación`, type: 'info', appId: 'hubcareer' });
  }
  return { ok: true, comment };
}

export async function toggleSavePost(discordId: string, postId: string): Promise<{ ok: boolean; saved?: boolean; error?: string }> {
  const col = await careerPostsCollection();
  const post = await col.findOne({ id: postId });
  if (!post) return { ok: false, error: 'Publicación no encontrada' };
  const saved = post.savedBy.includes(discordId);
  await col.updateOne({ id: postId }, saved ? { $pull: { savedBy: discordId } } : { $addToSet: { savedBy: discordId } });
  return { ok: true, saved: !saved };
}

export async function sharePost(postId: string): Promise<{ ok: boolean; error?: string }> {
  const col = await careerPostsCollection();
  const post = await col.findOne({ id: postId });
  if (!post) return { ok: false, error: 'Publicación no encontrada' };
  await col.updateOne({ id: postId }, { $inc: { shareCount: 1 } });
  return { ok: true };
}
