'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Eye, Pencil, Trash2, Flag, Check, X, Send } from 'lucide-react';
import type { Post, Profile } from './types';
import { timeAgo, renderTextWithMentions } from './types';
import VerifiedBadge from './VerifiedBadge';
import ReportModal from './ReportModal';
import { useToast } from '@/components/os/ui';

interface PostCardProps {
  post: Post;
  me: Profile | null;
  onOpenProfile: (discordId: string) => void;
  onToggleLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onShare: (postId: string) => void;
  onSendComment: (postId: string, text: string) => void;
  onDelete: (postId: string) => void;
  onReport: (postId: string, reason: string) => void;
  onSaveEdit: (postId: string, text: string) => void;
}

export default function PostCard({
  post, me, onOpenProfile, onToggleLike, onToggleSave, onShare, onSendComment, onDelete, onReport, onSaveEdit,
}: PostCardProps) {
  const toast = useToast();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(post.text);
  const [reporting, setReporting] = useState(false);

  const liked = me ? post.likes.includes(me.discordId) : false;
  const saved = me ? post.savedBy.includes(me.discordId) : false;
  const shared = me ? post.shares.includes(me.discordId) : false;
  const isMine = me?.discordId === post.discordId;

  const submitComment = () => {
    const text = commentDraft.trim();
    if (!text) return;
    onSendComment(post.id, text);
    setCommentDraft('');
  };

  const submitEdit = () => {
    const text = editDraft.trim();
    if (!text) return;
    onSaveEdit(post.id, text);
    setEditing(false);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="p-4 pb-2 flex items-start gap-3">
        <button onClick={() => onOpenProfile(post.discordId)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.avatar} alt={post.username} className="w-9 h-9 rounded-full flex-shrink-0" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={() => onOpenProfile(post.discordId)} className="text-white text-sm font-semibold truncate hover:underline">
              {post.displayName}
            </button>
            <VerifiedBadge verified={post.verified} accountType={post.accountType} />
            <span className="text-white/40 text-xs truncate">@{post.username}</span>
            <span className="text-white/30 text-xs flex-shrink-0">
              · {timeAgo(post.createdAt)}{post.editedAt ? ' · editado' : ''}
            </span>
          </div>
          {editing ? (
            <div className="mt-1.5 space-y-1.5">
              <textarea
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                rows={2}
                maxLength={500}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white resize-none focus:outline-none focus:border-violet-500/50"
              />
              <div className="flex gap-1.5">
                <button onClick={submitEdit} className="p-1 rounded bg-violet-600 hover:bg-violet-500 text-white"><Check className="w-3.5 h-3.5" /></button>
                <button onClick={() => setEditing(false)} className="p-1 rounded bg-white/10 hover:bg-white/20 text-white"><X className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ) : (
            post.text && <p className="text-white/80 text-sm mt-1 whitespace-pre-wrap break-words">{renderTextWithMentions(post.text)}</p>
          )}
        </div>
        {isMine && !editing && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => { setEditDraft(post.text); setEditing(true); }} className="text-white/30 hover:text-violet-400 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => onDelete(post.id)} className="text-white/30 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        )}
        {!isMine && (
          <button onClick={() => setReporting(true)} title="Reportar" className="text-white/20 hover:text-amber-400 transition-colors flex-shrink-0">
            <Flag className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {reporting && (
        <ReportModal
          onClose={() => setReporting(false)}
          onSubmit={(reason) => {
            onReport(post.id, reason);
            setReporting(false);
            toast.success('Gracias, tu reporte fue enviado al staff.');
          }}
        />
      )}

      {post.imageUrl && (
        <div className="w-full max-h-96 overflow-hidden bg-black/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="px-4 py-2.5 flex items-center gap-4 border-t border-white/5 mt-1">
        <button onClick={() => onToggleLike(post.id)} className="flex items-center gap-1.5 text-sm transition-colors group">
          <Heart className={`w-4 h-4 transition-all ${liked ? 'fill-violet-500 text-violet-500 scale-110' : 'text-white/50 group-hover:text-violet-400'}`} />
          <span className={liked ? 'text-violet-400' : 'text-white/50'}>{post.likes.length}</span>
        </button>
        <button onClick={() => setCommentsOpen((v) => !v)} className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span>{post.comments.length}</span>
        </button>
        <button onClick={() => onShare(post.id)} className="flex items-center gap-1.5 text-sm transition-colors">
          <Share2 className={`w-4 h-4 ${shared ? 'text-emerald-400' : 'text-white/50 hover:text-white/80'}`} />
          <span className={shared ? 'text-emerald-400' : 'text-white/50'}>{post.shares.length}</span>
        </button>
        <button onClick={() => onToggleSave(post.id)} className="ml-auto text-white/50 hover:text-violet-400 transition-colors">
          <Bookmark className={`w-4 h-4 ${saved ? 'fill-violet-400 text-violet-400' : ''}`} />
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
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitComment()}
              placeholder="Comentar..."
              maxLength={300}
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50"
            />
            <button onClick={submitComment} className="p-1.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white transition-colors">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
