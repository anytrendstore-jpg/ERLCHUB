'use client';

import { useState } from 'react';
import { MessageCircle, Share2, Bookmark, Eye, Pencil, Trash2, Flag, Check, X } from 'lucide-react';
import type { Post, Profile, ReactionType } from './types';
import { timeAgo, renderTextWithMentions, reactionsOf } from './types';
import VerifiedBadge from './VerifiedBadge';
import ReportModal from './ReportModal';
import ReactionPicker from './ReactionPicker';
import CommentThread from './CommentThread';
import { useToast } from '@/components/os/ui';

interface PostCardProps {
  post: Post;
  me: Profile | null;
  onOpenProfile: (discordId: string) => void;
  onOpenPage?: (pageId: string) => void;
  onReact: (postId: string, type: ReactionType) => void;
  onToggleSave: (postId: string) => void;
  onShare: (postId: string) => void;
  onSendComment: (postId: string, text: string, parentCommentId?: string) => void;
  onDelete: (postId: string) => void;
  onReport: (postId: string, reason: string) => void;
  onSaveEdit: (postId: string, text: string) => void;
}

export default function PostCard({
  post, me, onOpenProfile, onOpenPage, onReact, onToggleSave, onShare, onSendComment, onDelete, onReport, onSaveEdit,
}: PostCardProps) {
  const toast = useToast();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(post.text);
  const [reporting, setReporting] = useState(false);

  const saved = me ? post.savedBy.includes(me.discordId) : false;
  const shared = me ? post.shares.includes(me.discordId) : false;
  // Publicaciones de página: solo la persona que efectivamente publicó puede editar/borrar
  // desde acá (otros admins de la página pueden hacerlo desde el detalle de la página).
  const isMine = me?.discordId === post.discordId;
  const openAuthor = () => (post.authorPageId && onOpenPage ? onOpenPage(post.authorPageId) : onOpenProfile(post.discordId));

  const submitEdit = () => {
    const text = editDraft.trim();
    if (!text) return;
    onSaveEdit(post.id, text);
    setEditing(false);
  };

  return (
    <div className="hs-card hs-card-hover rounded-2xl overflow-hidden">
      <div className="p-4 pb-2 flex items-start gap-3">
        <button onClick={openAuthor} className="flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.avatar} alt={post.username} className="w-10 h-10 rounded-full ring-1 ring-white/10" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={openAuthor} className="text-white text-sm font-semibold truncate hover:underline">
              {post.displayName}
            </button>
            <VerifiedBadge verified={post.verified} accountType={post.accountType} />
            {!post.authorPageId && <span className="text-white/40 text-xs truncate">@{post.username}</span>}
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
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white resize-none focus:outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10"
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
        <div className="w-full max-h-96 overflow-hidden bg-black/30 border-y border-white/[0.06]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="px-4 py-2.5 flex items-center gap-4 border-t border-white/[0.06] mt-1">
        <ReactionPicker reactions={reactionsOf(post)} myDiscordId={me?.discordId} onReact={(type) => onReact(post.id, type)} />
        <button onClick={() => setCommentsOpen((v) => !v)} className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span>{post.comments.length}</span>
        </button>
        <button onClick={() => onShare(post.id)} className="flex items-center gap-1.5 text-sm transition-colors">
          <Share2 className={`w-4 h-4 ${shared ? 'text-emerald-400' : 'text-white/50 hover:text-white/80'}`} />
          <span className={shared ? 'text-emerald-400' : 'text-white/50'}>{post.shares.length}</span>
        </button>
        <button onClick={() => onToggleSave(post.id)} className="ml-auto text-white/50 hover:text-violet-300 transition-colors">
          <Bookmark className={`w-4 h-4 ${saved ? 'fill-violet-400 text-violet-400' : ''}`} />
        </button>
        <span className="flex items-center gap-1 text-white/30 text-xs">
          <Eye className="w-3.5 h-3.5" /> {post.viewedBy.length}
        </span>
      </div>

      {commentsOpen && (
        <CommentThread comments={post.comments} onSendComment={(text, parentCommentId) => onSendComment(post.id, text, parentCommentId)} />
      )}
    </div>
  );
}
