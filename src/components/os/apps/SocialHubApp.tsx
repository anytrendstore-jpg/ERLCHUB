'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Heart, MessageCircle, Image as ImageIcon, Send, Trash2, Sparkles,
  Search, ArrowLeft, Share2, Bookmark, Eye, Pencil, X, Check, UserPlus, UserMinus, Plus, Type,
  BadgeCheck, Building2, Flag, MessageSquare,
} from 'lucide-react';
import { useOS } from '@/contexts/OSContext';

interface Story {
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

interface StoryGroup {
  discordId: string;
  username: string;
  displayName: string;
  avatar?: string;
  hasUnseen: boolean;
  stories: Story[];
}

interface Comment {
  id: string;
  discordId: string;
  username: string;
  displayName: string;
  avatar?: string;
  text: string;
  createdAt: string;
}

interface Post {
  id: string;
  discordId: string;
  username: string;
  displayName: string;
  avatar?: string;
  text: string;
  imageUrl?: string;
  likes: string[];
  comments: Comment[];
  shares: string[];
  savedBy: string[];
  viewedBy: string[];
  editedAt?: string;
  verified?: boolean;
  accountType?: 'personal' | 'business' | 'organization';
  createdAt: string;
}

interface Profile {
  discordId: string;
  username: string;
  displayName: string;
  avatar?: string;
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string;
  verified?: boolean;
  accountType?: 'personal' | 'business' | 'organization';
}

function VerifiedBadge({ verified, accountType }: { verified?: boolean; accountType?: string }) {
  if (accountType === 'business' || accountType === 'organization') {
    return (
      <span title={accountType === 'business' ? 'Cuenta de empresa' : 'Cuenta de organización'}>
        <Building2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
      </span>
    );
  }
  if (verified) {
    return (
      <span title="Cuenta verificada">
        <BadgeCheck className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
      </span>
    );
  }
  return null;
}

type View = { mode: 'feed' } | { mode: 'profile'; discordId: string } | { mode: 'saved' };

const POLL_MS = 10000;

function renderTextWithMentions(text: string): React.ReactNode {
  const parts = text.split(/(@[a-zA-Z0-9_.]{2,32})/g);
  return parts.map((part, i) => (
    part.startsWith('@')
      ? <span key={i} className="text-pink-400 font-medium">{part}</span>
      : <React.Fragment key={i}>{part}</React.Fragment>
  ));
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'ahora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function SocialHubApp() {
  const { openApp } = useOS();
  const [view, setView] = useState<View>({ mode: 'feed' });
  const [feedTab, setFeedTab] = useState<'forYou' | 'following'>('forYou');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftText, setDraftText] = useState('');
  const [draftImage, setDraftImage] = useState('');
  const [showImageField, setShowImageField] = useState(false);
  const [posting, setPosting] = useState(false);
  const [me, setMe] = useState<Profile | null>(null);
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ discordId: string; username: string; displayName: string; avatar?: string }[]>([]);
  const [searchPostResults, setSearchPostResults] = useState<Post[]>([]);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [openStoryGroup, setOpenStoryGroup] = useState<StoryGroup | null>(null);
  const [openStoryIndex, setOpenStoryIndex] = useState(0);
  const [showAddStory, setShowAddStory] = useState(false);
  const [storyType, setStoryType] = useState<'text' | 'image'>('text');
  const [storyContent, setStoryContent] = useState('');
  const viewedRef = useRef<Set<string>>(new Set());
  const storyViewedRef = useRef<Set<string>>(new Set());

  const loadFeed = useCallback(async () => {
    try {
      let url = '/api/social/posts';
      if (view.mode === 'profile') url += `?discordId=${view.discordId}`;
      else if (view.mode === 'saved') url += `?saved=1`;
      else if (feedTab === 'following') url += `?feed=following`;
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setPosts(data.posts);
    } finally {
      setLoading(false);
    }
  }, [view, feedTab]);

  useEffect(() => {
    setLoading(true);
    loadFeed();
    const interval = setInterval(loadFeed, POLL_MS);
    return () => clearInterval(interval);
  }, [loadFeed]);

  const loadStories = useCallback(async () => {
    const res = await fetch('/api/social/stories', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setStoryGroups(data.groups);
  }, []);

  useEffect(() => {
    loadStories();
    const interval = setInterval(loadStories, POLL_MS);
    return () => clearInterval(interval);
  }, [loadStories]);

  const openStory = (group: StoryGroup, index = 0) => {
    setOpenStoryGroup(group);
    setOpenStoryIndex(index);
  };

  useEffect(() => {
    if (!openStoryGroup) return;
    const story = openStoryGroup.stories[openStoryIndex];
    if (!story || storyViewedRef.current.has(story.id)) return;
    storyViewedRef.current.add(story.id);
    fetch('/api/social/stories/view', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storyId: story.id }),
    }).catch(() => {});
  }, [openStoryGroup, openStoryIndex]);

  const publishStory = async () => {
    if (!storyContent.trim()) return;
    const res = await fetch('/api/social/stories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: storyType, content: storyContent.trim() }),
    });
    const data = await res.json();
    if (data.success) {
      setShowAddStory(false);
      setStoryContent('');
      await loadStories();
    }
  };

  useEffect(() => {
    fetch('/api/social/profile', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d.success) setMe(d.profile); })
      .catch(() => {});
  }, []);

  // Registrar vistas una sola vez por post mostrado.
  useEffect(() => {
    posts.forEach((p) => {
      if (!viewedRef.current.has(p.id)) {
        viewedRef.current.add(p.id);
        fetch('/api/social/posts/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: p.id }),
        }).catch(() => {});
      }
    });
  }, [posts]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); setSearchPostResults([]); return; }
    const timeout = setTimeout(() => {
      fetch(`/api/social/search?q=${encodeURIComponent(searchQuery.trim())}&posts=1`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => { if (d.success) { setSearchResults(d.users); setSearchPostResults(d.posts || []); } });
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const publish = async () => {
    if (!draftText.trim() && !draftImage.trim()) return;
    setPosting(true);
    try {
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: draftText.trim(), imageUrl: draftImage.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success && view.mode === 'feed') {
        setPosts((prev) => [data.post, ...prev]);
        setDraftText('');
        setDraftImage('');
        setShowImageField(false);
      }
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (postId: string) => {
    if (!me) return;
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      const liked = p.likes.includes(me.discordId);
      return { ...p, likes: liked ? p.likes.filter((id) => id !== me.discordId) : [...p.likes, me.discordId] };
    }));
    await fetch('/api/social/posts/like', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId }),
    });
  };

  const toggleSave = async (postId: string) => {
    if (!me) return;
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      const saved = p.savedBy.includes(me.discordId);
      return { ...p, savedBy: saved ? p.savedBy.filter((id) => id !== me.discordId) : [...p.savedBy, me.discordId] };
    }));
    await fetch('/api/social/posts/save', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId }),
    });
  };

  const share = async (postId: string) => {
    setPosts((prev) => prev.map((p) => p.id === postId && me && !p.shares.includes(me.discordId)
      ? { ...p, shares: [...p.shares, me.discordId] } : p));
    await fetch('/api/social/posts/share', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId }),
    });
  };

  const toggleComments = (postId: string) => {
    setOpenComments((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId); else next.add(postId);
      return next;
    });
  };

  const sendComment = async (postId: string) => {
    const text = (commentDrafts[postId] || '').trim();
    if (!text) return;
    const res = await fetch('/api/social/posts/comment', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, text }),
    });
    const data = await res.json();
    if (data.success) {
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments: [...p.comments, data.comment] } : p));
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
    }
  };

  const deletePost = async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    await fetch('/api/social/posts', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId }),
    });
  };

  const reportPost = async (postId: string) => {
    const reason = window.prompt('¿Por qué reportas esta publicación?');
    if (!reason || !reason.trim()) return;
    await fetch('/api/social/report', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType: 'post', targetId: postId, reason: reason.trim() }),
    });
    window.alert('Gracias, tu reporte fue enviado al staff.');
  };

  const startEdit = (post: Post) => { setEditingPost(post.id); setEditDraft(post.text); };
  const saveEdit = async (postId: string) => {
    const text = editDraft.trim();
    if (!text) return;
    await fetch('/api/social/posts', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, text }),
    });
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, text, editedAt: new Date().toISOString() } : p));
    setEditingPost(null);
  };

  const openProfile = (discordId: string) => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchPostResults([]);
    setView({ mode: 'profile', discordId });
  };

  return (
    <div className="relative h-full flex bg-[#0a0a0f]">
      {/* Sidebar */}
      <div className="w-56 border-r border-white/5 flex flex-col p-4 flex-shrink-0">
        <h2 className="text-white font-bold text-lg flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-pink-400" /> HubSocial
        </h2>
        <nav className="space-y-1">
          <button
            onClick={() => setView({ mode: 'feed' })}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${view.mode === 'feed' ? 'bg-pink-600/20 text-pink-400' : 'text-white/60 hover:bg-white/5'}`}
          >
            Inicio
          </button>
          {me && (
            <button
              onClick={() => openProfile(me.discordId)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${view.mode === 'profile' && view.discordId === me.discordId ? 'bg-pink-600/20 text-pink-400' : 'text-white/60 hover:bg-white/5'}`}
            >
              Mi perfil
            </button>
          )}
          <button
            onClick={() => setView({ mode: 'saved' })}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${view.mode === 'saved' ? 'bg-pink-600/20 text-pink-400' : 'text-white/60 hover:bg-white/5'}`}
          >
            Guardados
          </button>
        </nav>

        <div className="mt-4 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar usuarios..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-2 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-pink-500/50"
          />
          {(searchResults.length > 0 || searchPostResults.length > 0) && (
            <div className="mt-2 space-y-1 max-h-80 overflow-y-auto">
              {searchResults.map((u) => (
                <button
                  key={u.discordId}
                  onClick={() => openProfile(u.discordId)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-left"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u.avatar} alt="" className="w-6 h-6 rounded-full" />
                  <span className="min-w-0 text-left">
                    <span className="block text-white/80 text-xs truncate">{u.displayName}</span>
                    <span className="block text-white/40 text-[10px] truncate">@{u.username}</span>
                  </span>
                </button>
              ))}
              {searchPostResults.length > 0 && (
                <>
                  <p className="text-white/30 text-[10px] uppercase tracking-wide px-2 pt-2">Publicaciones</p>
                  {searchPostResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => openProfile(p.discordId)}
                      className="w-full px-2 py-1.5 rounded-lg hover:bg-white/5 text-left"
                    >
                      <span className="block text-white/70 text-[10px] truncate">{p.displayName}: {p.text}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-xl mx-auto py-6 px-4">
          {view.mode === 'profile' ? (
            <ProfileHeader
              discordId={view.discordId}
              me={me}
              onBack={() => setView({ mode: 'feed' })}
              onUpdatedSelf={(p) => setMe(p)}
            />
          ) : view.mode === 'saved' ? (
            <h1 className="text-white text-xl font-bold mb-4">Guardados</h1>
          ) : (
            <div className="flex items-center gap-1 mb-4 border-b border-white/10">
              <button
                onClick={() => setFeedTab('forYou')}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${feedTab === 'forYou' ? 'text-white border-pink-500' : 'text-white/40 border-transparent hover:text-white/70'}`}
              >
                Para ti
              </button>
              <button
                onClick={() => setFeedTab('following')}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${feedTab === 'following' ? 'text-white border-pink-500' : 'text-white/40 border-transparent hover:text-white/70'}`}
              >
                Siguiendo
              </button>
            </div>
          )}

          {/* Historias */}
          {view.mode === 'feed' && (
            <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
              <button onClick={() => setShowAddStory(true)} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center hover:border-pink-500/50 transition-colors">
                  <Plus className="w-5 h-5 text-white/40" />
                </div>
                <span className="text-white/40 text-[10px]">Tu historia</span>
              </button>
              {storyGroups.map((g) => (
                <button key={g.discordId} onClick={() => openStory(g)} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <div className={`w-14 h-14 rounded-full p-0.5 ${g.hasUnseen ? 'bg-gradient-to-br from-pink-500 to-purple-600' : 'bg-white/10'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.avatar} alt={g.displayName} className="w-full h-full rounded-full object-cover border-2 border-[#0a0a0f]" />
                  </div>
                  <span className="text-white/60 text-[10px] max-w-[56px] truncate">{g.displayName}</span>
                </button>
              ))}
            </div>
          )}

          {/* Composer solo en el feed principal */}
          {view.mode === 'feed' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="¿Qué está pasando en ERLC?"
                maxLength={500}
                rows={2}
                className="w-full bg-transparent text-white placeholder-white/30 text-sm resize-none focus:outline-none"
              />
              {showImageField && (
                <input
                  type="text"
                  value={draftImage}
                  onChange={(e) => setDraftImage(e.target.value)}
                  placeholder="URL de imagen..."
                  className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-pink-500/50"
                />
              )}
              {draftImage && (
                <div className="mt-2 rounded-xl overflow-hidden border border-white/10 max-h-48">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={draftImage} alt="preview" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={() => setShowImageField((v) => !v)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${showImageField ? 'bg-pink-600/20 text-pink-400' : 'text-white/50 hover:bg-white/5'}`}
                >
                  <ImageIcon className="w-3.5 h-3.5" /> Imagen
                </button>
                <button
                  onClick={publish}
                  disabled={posting || (!draftText.trim() && !draftImage.trim())}
                  className="px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-opacity"
                >
                  Publicar
                </button>
              </div>
            </div>
          )}

          {/* Feed */}
          {loading ? (
            <p className="text-white/40 text-sm text-center">Cargando...</p>
          ) : posts.length === 0 ? (
            <p className="text-white/40 text-sm text-center">
              {view.mode === 'saved'
                ? 'No has guardado nada todavía.'
                : view.mode === 'feed' && feedTab === 'following'
                  ? 'No sigues a nadie todavía, o las personas que sigues no han publicado nada.'
                  : 'Todavía no hay publicaciones.'}
            </p>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => {
                const liked = me ? post.likes.includes(me.discordId) : false;
                const saved = me ? post.savedBy.includes(me.discordId) : false;
                const shared = me ? post.shares.includes(me.discordId) : false;
                const commentsOpen = openComments.has(post.id);
                const isMine = me?.discordId === post.discordId;
                return (
                  <div key={post.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-4 pb-2 flex items-start gap-3">
                      <button onClick={() => openProfile(post.discordId)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={post.avatar} alt={post.username} className="w-9 h-9 rounded-full flex-shrink-0" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button onClick={() => openProfile(post.discordId)} className="text-white text-sm font-semibold truncate hover:underline">
                            {post.displayName}
                          </button>
                          <VerifiedBadge verified={post.verified} accountType={post.accountType} />
                          <span className="text-white/40 text-xs truncate">@{post.username}</span>
                          <span className="text-white/30 text-xs flex-shrink-0">
                            · {timeAgo(post.createdAt)}{post.editedAt ? ' · editado' : ''}
                          </span>
                        </div>
                        {editingPost === post.id ? (
                          <div className="mt-1.5 space-y-1.5">
                            <textarea
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                              rows={2}
                              maxLength={500}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white resize-none focus:outline-none focus:border-pink-500/50"
                            />
                            <div className="flex gap-1.5">
                              <button onClick={() => saveEdit(post.id)} className="p-1 rounded bg-pink-600 hover:bg-pink-500 text-white"><Check className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setEditingPost(null)} className="p-1 rounded bg-white/10 hover:bg-white/20 text-white"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        ) : (
                          post.text && <p className="text-white/80 text-sm mt-1 whitespace-pre-wrap break-words">{renderTextWithMentions(post.text)}</p>
                        )}
                      </div>
                      {isMine && editingPost !== post.id && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => startEdit(post)} className="text-white/30 hover:text-pink-400 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deletePost(post.id)} className="text-white/30 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                      {!isMine && (
                        <button onClick={() => reportPost(post.id)} title="Reportar" className="text-white/20 hover:text-amber-400 transition-colors flex-shrink-0">
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {post.imageUrl && (
                      <div className="w-full max-h-96 overflow-hidden bg-black/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="px-4 py-2.5 flex items-center gap-4 border-t border-white/5 mt-1">
                      <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1.5 text-sm transition-colors group">
                        <Heart className={`w-4 h-4 transition-all ${liked ? 'fill-pink-500 text-pink-500 scale-110' : 'text-white/50 group-hover:text-pink-400'}`} />
                        <span className={liked ? 'text-pink-400' : 'text-white/50'}>{post.likes.length}</span>
                      </button>
                      <button onClick={() => toggleComments(post.id)} className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments.length}</span>
                      </button>
                      <button onClick={() => share(post.id)} className="flex items-center gap-1.5 text-sm transition-colors">
                        <Share2 className={`w-4 h-4 ${shared ? 'text-emerald-400' : 'text-white/50 hover:text-white/80'}`} />
                        <span className={shared ? 'text-emerald-400' : 'text-white/50'}>{post.shares.length}</span>
                      </button>
                      <button onClick={() => toggleSave(post.id)} className="ml-auto text-white/50 hover:text-pink-400 transition-colors">
                        <Bookmark className={`w-4 h-4 ${saved ? 'fill-pink-400 text-pink-400' : ''}`} />
                      </button>
                      <span className="flex items-center gap-1 text-white/30 text-xs">
                        <Eye className="w-3.5 h-3.5" /> {post.viewedBy.length}
                      </span>
                    </div>

                    {commentsOpen && (
                      <div className="px-4 pb-3 space-y-2 border-t border-white/5 pt-2">
                        {post.comments.map((c) => (
                          <div key={c.id} className="flex gap-2 items-baseline">
                            <span className="text-white/70 text-xs font-semibold flex-shrink-0">{c.displayName}</span>
                            <span className="text-white/60 text-xs">{renderTextWithMentions(c.text)}</span>
                          </div>
                        ))}
                        <div className="flex gap-2 pt-1">
                          <input
                            type="text"
                            value={commentDrafts[post.id] || ''}
                            onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && sendComment(post.id)}
                            placeholder="Comentar..."
                            maxLength={300}
                            className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-pink-500/50"
                          />
                          <button onClick={() => sendComment(post.id)} className="p-1.5 rounded-full bg-pink-600 hover:bg-pink-500 text-white transition-colors">
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Visor de historias */}
      {openStoryGroup && (() => {
        const story = openStoryGroup.stories[openStoryIndex];
        if (!story) { setOpenStoryGroup(null); return null; }
        const isLast = openStoryIndex === openStoryGroup.stories.length - 1;
        const isMineStory = me?.discordId === story.discordId;
        return (
          <div className="absolute inset-0 bg-black z-[3000] flex items-center justify-center" onClick={() => setOpenStoryGroup(null)}>
            <div className="relative w-full max-w-sm h-[80vh] rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}
              style={{ background: story.type === 'text' ? story.backgroundColor : '#000' }}>
              <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
                {openStoryGroup.stories.map((s, i) => (
                  <div key={s.id} className={`flex-1 h-0.5 rounded-full ${i <= openStoryIndex ? 'bg-white' : 'bg-white/30'}`} />
                ))}
              </div>
              <div className="absolute top-6 left-3 flex items-center gap-2 z-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={story.avatar} alt="" className="w-7 h-7 rounded-full" />
                <span className="text-white text-xs font-medium drop-shadow">{story.displayName}</span>
                <span className="text-white/60 text-[10px]">{timeAgo(story.createdAt)}</span>
              </div>
              <button onClick={() => setOpenStoryGroup(null)} className="absolute top-6 right-3 text-white/80 hover:text-white z-10"><X className="w-5 h-5" /></button>

              {story.type === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={story.content} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-8">
                  <p className="text-white text-2xl font-bold text-center break-words">{story.content}</p>
                </div>
              )}

              {isMineStory && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white/70 text-xs bg-black/40 px-2 py-1 rounded-full">
                  <Eye className="w-3.5 h-3.5" /> {story.viewedBy.length}
                </div>
              )}

              <button
                onClick={() => isLast ? setOpenStoryGroup(null) : setOpenStoryIndex((i) => i + 1)}
                className="absolute right-0 top-0 h-full w-1/2"
              />
              {openStoryIndex > 0 && (
                <button onClick={() => setOpenStoryIndex((i) => i - 1)} className="absolute left-0 top-0 h-full w-1/2" />
              )}
            </div>
          </div>
        );
      })()}

      {/* Publicar historia */}
      {showAddStory && (
        <div className="absolute inset-0 bg-black/60 z-[3000] flex items-center justify-center p-4" onClick={() => setShowAddStory(false)}>
          <div className="bg-[#0d0d14] border border-white/10 rounded-2xl w-full max-w-sm p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Nueva historia</h3>
              <button onClick={() => setShowAddStory(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setStoryType('text')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs ${storyType === 'text' ? 'bg-pink-600 text-white' : 'bg-white/5 text-white/60'}`}>
                <Type className="w-3.5 h-3.5" /> Texto
              </button>
              <button onClick={() => setStoryType('image')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs ${storyType === 'image' ? 'bg-pink-600 text-white' : 'bg-white/5 text-white/60'}`}>
                <ImageIcon className="w-3.5 h-3.5" /> Imagen
              </button>
            </div>
            {storyType === 'text' ? (
              <textarea value={storyContent} onChange={(e) => setStoryContent(e.target.value)} placeholder="Escribe algo..." rows={3} maxLength={200}
                className="w-full bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg px-3 py-3 text-sm text-white placeholder-white/60 resize-none focus:outline-none" />
            ) : (
              <input value={storyContent} onChange={(e) => setStoryContent(e.target.value)} placeholder="URL de la imagen..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-pink-500/50" />
            )}
            <p className="text-white/30 text-[10px] mt-2">Desaparece automáticamente en 24 horas.</p>
            <button onClick={publishStory} disabled={!storyContent.trim()}
              className="w-full mt-3 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 disabled:opacity-40 text-white text-sm font-semibold transition-opacity">
              Publicar historia
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileHeader({ discordId, me, onBack, onUpdatedSelf }: {
  discordId: string;
  me: Profile | null;
  onBack: () => void;
  onUpdatedSelf: (p: Profile) => void;
}) {
  const { openApp } = useOS();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ postsCount: 0, followersCount: 0, followingCount: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [messaging, setMessaging] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/social/profile?discordId=${discordId}`, { cache: 'no-store' });
    const data = await res.json();
    if (data.success) {
      setProfile(data.profile);
      setStats(data.stats);
      setIsFollowing(data.isFollowing);
      setIsSelf(data.isSelf);
      setBio(data.profile.bio || '');
      setAvatarUrl(data.profile.avatarUrl || '');
      setCoverUrl(data.profile.coverUrl || '');
    }
  }, [discordId]);

  useEffect(() => { load(); }, [load]);

  const toggleFollow = async () => {
    setIsFollowing((v) => !v);
    setStats((s) => ({ ...s, followersCount: s.followersCount + (isFollowing ? -1 : 1) }));
    await fetch('/api/social/follow', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetId: discordId }),
    });
  };

  const messageUser = async () => {
    setMessaging(true);
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ participantIds: [discordId] }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('hubchat_open_conversation', data.conversation.id);
        openApp('hubchat');
      }
    } finally {
      setMessaging(false);
    }
  };

  const saveProfile = async () => {
    await fetch('/api/social/profile', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bio, avatarUrl, coverUrl }),
    });
    setEditing(false);
    await load();
    if (profile) onUpdatedSelf({ ...profile, bio, avatarUrl, coverUrl });
  };

  if (!profile) return null;
  const avatar = profile.avatarUrl || profile.avatar;

  return (
    <div className="mb-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm mb-3 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-pink-600/30 to-purple-700/30 relative">
        {profile.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.coverUrl} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="flex items-end justify-between -mt-8 px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt={profile.username} className="w-16 h-16 rounded-full border-4 border-[#0a0a0f]" />
        {isSelf ? (
          <button onClick={() => setEditing((v) => !v)} className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors">
            {editing ? 'Cancelar' : 'Editar perfil'}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={messageUser}
              disabled={messaging}
              title="Enviar mensaje"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggleFollow}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                isFollowing ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90'
              }`}
            >
              {isFollowing ? <><UserMinus className="w-3.5 h-3.5" /> Dejar de seguir</> : <><UserPlus className="w-3.5 h-3.5" /> Seguir</>}
            </button>
          </div>
        )}
      </div>

      <div className="px-1 mt-2">
        <p className="text-white font-bold flex items-center gap-1.5">
          {profile.displayName}
          <VerifiedBadge verified={profile.verified} accountType={profile.accountType} />
        </p>
        <p className="text-white/40 text-sm">@{profile.username}</p>
        {!editing && profile.bio && <p className="text-white/60 text-sm mt-1">{profile.bio}</p>}

        {editing && (
          <div className="mt-2 space-y-2">
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Biografía..." maxLength={160} rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-pink-500/50" />
            <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="URL de foto de perfil..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-pink-500/50" />
            <input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="URL de foto de portada..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-pink-500/50" />
            <button onClick={saveProfile} className="px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 text-white text-xs font-semibold transition-opacity">
              Guardar
            </button>
          </div>
        )}

        <div className="flex items-center gap-4 mt-3 text-sm">
          <span className="text-white"><b>{stats.postsCount}</b> <span className="text-white/50">publicaciones</span></span>
          <span className="text-white"><b>{stats.followersCount}</b> <span className="text-white/50">seguidores</span></span>
          <span className="text-white"><b>{stats.followingCount}</b> <span className="text-white/50">seguidos</span></span>
        </div>
      </div>
    </div>
  );
}
