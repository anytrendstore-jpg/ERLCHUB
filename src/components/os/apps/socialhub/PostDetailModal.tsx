'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { Post, Profile, ReactionType } from './types';
import PostCard from './PostCard';

/** Vista de detalle estilo Instagram: se abre al tocar una celda de la grilla del perfil. */
export default function PostDetailModal({ post, me, onClose, onOpenProfile, onOpenPage, onReact, onToggleSave, onShare, onSendComment, onDelete, onReport, onSaveEdit }: {
  post: Post;
  me: Profile | null;
  onClose: () => void;
  onOpenProfile: (discordId: string) => void;
  onOpenPage?: (pageId: string) => void;
  onReact: (postId: string, type: ReactionType) => void;
  onToggleSave: (postId: string) => void;
  onShare: (postId: string) => void;
  onSendComment: (postId: string, text: string, parentCommentId?: string) => void;
  onDelete: (postId: string) => void;
  onReport: (postId: string, reason: string) => void;
  onSaveEdit: (postId: string, text: string) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-150" onClick={onClose}>
      <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-[#12121c] border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
        <PostCard
          post={post}
          me={me}
          onOpenProfile={onOpenProfile}
          onOpenPage={onOpenPage}
          onReact={onReact}
          onToggleSave={onToggleSave}
          onShare={onShare}
          onSendComment={onSendComment}
          onDelete={onDelete}
          onReport={onReport}
          onSaveEdit={onSaveEdit}
        />
      </div>
    </div>
  );
}
