'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Post, Profile, ReactionType } from './types';

const POLL_MS = 10000;

/** Carga y muta una lista de posts (feed/guardados/perfil) contra las mismas rutas de
 * /api/social/posts* que ya existen — centraliza la lógica que antes vivía duplicada
 * en el monolito de SocialHubApp para reusarla en Feed, Guardados y Perfil. */
export function useSocialPosts(endpoint: string | null, me: Profile | null) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const viewedRef = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!endpoint) { setPosts([]); setLoading(false); return; }
    try {
      const res = await fetch(endpoint, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setPosts(data.posts);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    setLoading(true);
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, [load]);

  // Registrar vistas una sola vez por post mostrado.
  useEffect(() => {
    posts.forEach((p) => {
      if (!viewedRef.current.has(p.id)) {
        viewedRef.current.add(p.id);
        fetch('/api/social/posts/view', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId: p.id }),
        }).catch(() => {});
      }
    });
  }, [posts]);

  const publish = useCallback(async (text: string, imageUrl?: string, pageId?: string, groupId?: string) => {
    const res = await fetch('/api/social/posts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, imageUrl, pageId, groupId }),
    });
    const data = await res.json();
    if (data.success) setPosts((prev) => [data.post, ...prev]);
    return data;
  }, []);

  const react = useCallback((postId: string, type: ReactionType) => {
    if (!me) return;
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      const current = p.reactions && p.reactions.length > 0 ? p.reactions : p.likes.map((id) => ({ discordId: id, type: 'like' as const }));
      const withoutMine = current.filter((r) => r.discordId !== me.discordId);
      const mine = current.find((r) => r.discordId === me.discordId);
      const nextReactions = mine?.type === type ? withoutMine : [...withoutMine, { discordId: me.discordId, type }];
      return { ...p, reactions: nextReactions };
    }));
    fetch('/api/social/posts/react', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, type }),
    }).catch(() => {});
  }, [me]);

  const toggleSave = useCallback((postId: string) => {
    if (!me) return;
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      const saved = p.savedBy.includes(me.discordId);
      return { ...p, savedBy: saved ? p.savedBy.filter((id) => id !== me.discordId) : [...p.savedBy, me.discordId] };
    }));
    fetch('/api/social/posts/save', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId }),
    }).catch(() => {});
  }, [me]);

  const share = useCallback((postId: string) => {
    setPosts((prev) => prev.map((p) => p.id === postId && me && !p.shares.includes(me.discordId)
      ? { ...p, shares: [...p.shares, me.discordId] } : p));
    fetch('/api/social/posts/share', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId }),
    }).catch(() => {});
  }, [me]);

  const sendComment = useCallback(async (postId: string, text: string, parentCommentId?: string) => {
    const res = await fetch('/api/social/posts/comment', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, text, parentCommentId }),
    });
    const data = await res.json();
    if (data.success) {
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments: [...p.comments, data.comment] } : p));
    }
  }, []);

  const deletePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    fetch('/api/social/posts', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId }),
    }).catch(() => {});
  }, []);

  const reportPost = useCallback(async (postId: string, reason: string) => {
    await fetch('/api/social/report', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType: 'post', targetId: postId, reason }),
    });
  }, []);

  const saveEdit = useCallback(async (postId: string, text: string) => {
    await fetch('/api/social/posts', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, text }),
    });
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, text, editedAt: new Date().toISOString() } : p));
  }, []);

  return { posts, loading, publish, react, toggleSave, share, sendComment, deletePost, reportPost, saveEdit, refetch: load };
}
