export interface Story {
  id: string;
  discordId: string;
  username: string;
  displayName: string;
  avatar?: string;
  type: 'image' | 'text';
  content: string;
  backgroundColor?: string;
  viewedBy: string[];
  createdAt: string;
}

export interface StoryGroup {
  discordId: string;
  username: string;
  displayName: string;
  avatar?: string;
  hasUnseen: boolean;
  stories: Story[];
}

export interface Comment {
  id: string;
  discordId: string;
  username: string;
  displayName: string;
  avatar?: string;
  text: string;
  parentCommentId?: string;
  createdAt: string;
}

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad';

export interface Reaction {
  discordId: string;
  type: ReactionType;
}

export interface Page {
  id: string;
  name: string;
  category: string;
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string;
  phone?: string;
  email?: string;
  website?: string;
  location?: string;
  verified: boolean;
  verificationType?: 'business' | 'organization' | 'government';
  ownerId: string;
  admins: string[];
  followersCount: number;
  postsCount?: number;
  isFollowing: boolean;
  isAdmin: boolean;
  createdAt: string;
}

export interface Post {
  id: string;
  discordId: string;
  username: string;
  displayName: string;
  avatar?: string;
  authorPageId?: string;
  text: string;
  imageUrl?: string;
  /** @deprecated leído para posts viejos sin `reactions` — ver `reactionsOf()` en este archivo. */
  likes: string[];
  reactions?: Reaction[];
  comments: Comment[];
  shares: string[];
  savedBy: string[];
  viewedBy: string[];
  editedAt?: string;
  verified?: boolean;
  accountType?: 'personal' | 'business' | 'organization';
  createdAt: string;
}

/** Normaliza reacciones: si el post ya tiene `reactions` las usa, si no, trata `likes` viejos
 * como reacciones tipo "like" — así los posts creados antes de las multi-reacciones se ven bien
 * sin ninguna migración de datos. */
export function reactionsOf(post: Post): Reaction[] {
  if (post.reactions && post.reactions.length > 0) return post.reactions;
  return post.likes.map((discordId) => ({ discordId, type: 'like' as const }));
}

export const REACTION_ORDER: ReactionType[] = ['like', 'love', 'haha', 'wow', 'sad'];

export interface Profile {
  discordId: string;
  username: string;
  displayName: string;
  avatar?: string;
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string;
  website?: string;
  verified?: boolean;
  accountType?: 'personal' | 'business' | 'organization';
}

/** Pestañas de nivel superior de HubSocial. Las que todavía no tienen datos reales (grupos,
 * páginas, eventos, marketplace, videos) se agregan en fases posteriores del rediseño —
 * mientras tanto muestran un estado "Próximamente" honesto, nunca contenido inventado. */
export type SocialView =
  | { mode: 'feed' }
  | { mode: 'explore' }
  | { mode: 'videos' }
  | { mode: 'marketplace' }
  | { mode: 'groups' }
  | { mode: 'pages' }
  | { mode: 'page'; pageId: string }
  | { mode: 'events' }
  | { mode: 'profile'; discordId: string }
  | { mode: 'saved' };

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'ahora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

import { createElement, Fragment, type ReactNode } from 'react';

export function renderTextWithMentions(text: string): ReactNode {
  const parts = text.split(/(@[a-zA-Z0-9_.]{2,32})/g);
  return parts.map((part, i) =>
    part.startsWith('@')
      ? createElement('span', { key: i, className: 'text-violet-400 font-medium' }, part)
      : createElement(Fragment, { key: i }, part)
  );
}
