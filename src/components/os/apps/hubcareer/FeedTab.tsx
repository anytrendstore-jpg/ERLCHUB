'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ThumbsUp, MessageSquare, Share2, Bookmark, Send, Globe, Users as UsersIcon, Lock, User as UserIcon, Building2, MoreHorizontal, Flag } from 'lucide-react';
import ReportModal from './ReportModal';

interface Post {
  id: string;
  authorType: 'user' | 'company';
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  imageUrl?: string;
  linkUrl?: string;
  visibility: 'public' | 'connections' | 'private';
  reactions: Record<string, string[]>;
  hasReacted: Record<string, boolean>;
  hasSaved: boolean;
  commentCount: number;
  shareCount: number;
  createdAt: string;
}

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

const VISIBILITY_ICON: Record<string, React.ElementType> = { public: Globe, connections: UsersIcon, private: Lock };
const VISIBILITY_LABEL: Record<string, string> = { public: 'Público', connections: 'Solo contactos', private: 'Solo yo' };

function totalReactions(reactions: Record<string, string[]>): number {
  return Object.values(reactions).reduce((sum, arr) => sum + arr.length, 0);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function FeedTab({ onOpenProfile, onOpenCompany }: { onOpenProfile: (id: string) => void; onOpenCompany: (id: string) => void }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'connections' | 'private'>('public');
  const [posting, setPosting] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState('');
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const [reportPost, setReportPost] = useState<Post | null>(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hubcareer/feed', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setPosts(data.posts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const publish = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      const res = await fetch('/api/hubcareer/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, visibility }) });
      const data = await res.json();
      if (data.success) { setText(''); await loadFeed(); }
    } finally {
      setPosting(false);
    }
  };

  const react = async (postId: string) => {
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      const reacted = p.hasReacted.like;
      return {
        ...p,
        hasReacted: { ...p.hasReacted, like: !reacted },
        reactions: { ...p.reactions, like: reacted ? p.reactions.like.slice(0, -1) : [...(p.reactions.like || []), 'me'] },
      };
    }));
    await fetch('/api/hubcareer/posts/react', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, reaction: 'like' }) });
  };

  const toggleComments = async (postId: string) => {
    if (openComments === postId) { setOpenComments(null); return; }
    setOpenComments(postId);
    if (!comments[postId]) {
      const res = await fetch(`/api/hubcareer/posts/comment?postId=${postId}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setComments((prev) => ({ ...prev, [postId]: data.comments }));
    }
  };

  const submitComment = async (postId: string) => {
    if (!commentText.trim()) return;
    const res = await fetch('/api/hubcareer/posts/comment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, text: commentText }) });
    const data = await res.json();
    if (data.success) {
      setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), data.comment] }));
      setCommentText('');
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p));
    }
  };

  const toggleSave = async (postId: string) => {
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, hasSaved: !p.hasSaved } : p));
    await fetch('/api/hubcareer/posts/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, action: 'save' }) });
  };

  const share = async (postId: string) => {
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, shareCount: p.shareCount + 1 } : p));
    await fetch('/api/hubcareer/posts/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, action: 'share' }) });
  };

  const VisIcon = VISIBILITY_ICON[visibility];

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <div className="bg-white/5 rounded-xl border border-white/10 p-4">
        <textarea
          value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Comparte una actualización profesional..."
          rows={3}
          className="w-full bg-transparent text-sm text-white placeholder-white/30 focus:outline-none resize-none"
        />
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
          <select
            value={visibility} onChange={(e) => setVisibility(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/60 focus:outline-none"
          >
            <option value="public">🌐 Público</option>
            <option value="connections">👥 Solo contactos</option>
            <option value="private">🔒 Solo yo</option>
          </select>
          <button
            onClick={publish} disabled={posting || !text.trim()}
            className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
          >
            {posting ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </div>

      {loading && <p className="text-white/30 text-sm text-center py-6">Cargando...</p>}
      {!loading && posts.length === 0 && <p className="text-white/30 text-sm text-center py-10">Sin publicaciones todavía. Conecta con otros o sigue empresas para llenar tu feed.</p>}

      {posts.map((post) => {
        const PostVisIcon = VISIBILITY_ICON[post.visibility];
        return (
          <div key={post.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <button onClick={() => post.authorType === 'company' ? onOpenCompany(post.authorId) : onOpenProfile(post.authorId)} className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-sky-600/30 flex items-center justify-center flex-shrink-0">
                  {post.authorType === 'company' ? <Building2 className="w-4 h-4 text-sky-300" /> : <UserIcon className="w-4 h-4 text-sky-300" />}
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-sm font-semibold text-white truncate">{post.authorName}</p>
                  <p className="text-white/40 text-[11px] flex items-center gap-1">{timeAgo(post.createdAt)} · <PostVisIcon className="w-3 h-3" /></p>
                </div>
              </button>
              <div className="relative ml-auto">
                <button onClick={() => setOpenMenuFor(openMenuFor === post.id ? null : post.id)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"><MoreHorizontal className="w-4 h-4 text-white/40" /></button>
                {openMenuFor === post.id && (
                  <div className="absolute right-0 top-full mt-1 w-36 bg-[#0f2536] border border-white/10 rounded-lg overflow-hidden shadow-xl z-10">
                    <button onClick={() => { setOpenMenuFor(null); setReportPost(post); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-white/5 text-left">
                      <Flag className="w-3.5 h-3.5" /> Reportar
                    </button>
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm text-white/90 whitespace-pre-wrap mb-3">{post.text}</p>

            {(totalReactions(post.reactions) > 0 || post.commentCount > 0) && (
              <div className="flex items-center justify-between text-[11px] text-white/40 mb-2">
                <span>{totalReactions(post.reactions)} reacciones</span>
                <span>{post.commentCount} comentarios · {post.shareCount} compartidos</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <button onClick={() => react(post.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${post.hasReacted.like ? 'text-sky-400' : 'text-white/50 hover:bg-white/5'}`}>
                <ThumbsUp className="w-3.5 h-3.5" /> Me gusta
              </button>
              <button onClick={() => toggleComments(post.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:bg-white/5 transition-colors">
                <MessageSquare className="w-3.5 h-3.5" /> Comentar
              </button>
              <button onClick={() => share(post.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:bg-white/5 transition-colors">
                <Share2 className="w-3.5 h-3.5" /> Compartir
              </button>
              <button onClick={() => toggleSave(post.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${post.hasSaved ? 'text-amber-400' : 'text-white/50 hover:bg-white/5'}`}>
                <Bookmark className="w-3.5 h-3.5" /> Guardar
              </button>
            </div>

            {openComments === post.id && (
              <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                {(comments[post.id] || []).map((c) => (
                  <div key={c.id} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0" />
                    <div className="bg-white/5 rounded-lg px-3 py-1.5 flex-1">
                      <p className="text-xs font-semibold text-white">{c.authorName}</p>
                      <p className="text-xs text-white/70">{c.text}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    value={commentText} onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') submitComment(post.id); }}
                    placeholder="Escribe un comentario..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none"
                  />
                  <button onClick={() => submitComment(post.id)} className="p-1.5 rounded-full bg-sky-600 hover:bg-sky-500 transition-colors"><Send className="w-3 h-3" /></button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {reportPost && (
        <ReportModal
          targetType="post" targetId={reportPost.id} targetLabel={`Publicación de ${reportPost.authorName}`}
          onClose={() => setReportPost(null)}
          onSubmitted={() => setReportPost(null)}
        />
      )}
    </div>
  );
}
