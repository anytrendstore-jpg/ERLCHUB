'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import type { Comment } from './types';
import { renderTextWithMentions } from './types';

function CommentRow({ comment, indented, onReply }: { comment: Comment; indented?: boolean; onReply?: () => void }) {
  return (
    <div className={indented ? 'ml-7 mt-2' : ''}>
      <div className="flex gap-2 items-baseline">
        <span className="text-white/70 text-xs font-semibold flex-shrink-0">{comment.displayName}</span>
        <span className="text-white/60 text-xs">{renderTextWithMentions(comment.text)}</span>
      </div>
      {onReply && (
        <button onClick={onReply} className="text-white/30 hover:text-violet-400 text-[10px] mt-0.5 transition-colors">
          Responder
        </button>
      )}
    </div>
  );
}

export default function CommentThread({ comments, onSendComment }: {
  comments: Comment[];
  onSendComment: (text: string, parentCommentId?: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

  const topLevel = comments.filter((c) => !c.parentCommentId);
  const repliesOf = (id: string) => comments.filter((c) => c.parentCommentId === id);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onSendComment(text, replyTo?.id);
    setDraft('');
    setReplyTo(null);
  };

  return (
    <div className="px-4 pb-3 space-y-3 border-t border-white/5 pt-2">
      {topLevel.map((comment) => (
        <div key={comment.id}>
          <CommentRow comment={comment} onReply={() => setReplyTo(comment)} />
          {repliesOf(comment.id).map((reply) => (
            <CommentRow key={reply.id} comment={reply} indented />
          ))}
        </div>
      ))}

      <div>
        {replyTo && (
          <div className="flex items-center justify-between mb-1.5 text-[10px] text-white/40">
            <span>Respondiendo a <span className="text-white/70">{replyTo.displayName}</span></span>
            <button onClick={() => setReplyTo(null)} className="hover:text-white/70">Cancelar</button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={replyTo ? `Responder a ${replyTo.displayName}...` : 'Comentar...'}
            maxLength={300}
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10"
          />
          <button onClick={submit} className="p-1.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white transition-colors flex-shrink-0">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
