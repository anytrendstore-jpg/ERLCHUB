'use client';

import { useRef, useState } from 'react';
import { ThumbsUp, Heart, Laugh, Sparkles, Frown, type LucideIcon } from 'lucide-react';
import type { ReactionType, Reaction } from './types';
import { REACTION_ORDER } from './types';

const REACTION_META: Record<ReactionType, { icon: LucideIcon; label: string; color: string }> = {
  like: { icon: ThumbsUp, label: 'Me gusta', color: '#8b5cf6' },
  love: { icon: Heart, label: 'Me encanta', color: '#f43f5e' },
  haha: { icon: Laugh, label: 'Me divierte', color: '#f59e0b' },
  wow: { icon: Sparkles, label: 'Me sorprende', color: '#38bdf8' },
  sad: { icon: Frown, label: 'Me entristece', color: '#64748b' },
};

const HOVER_CLOSE_DELAY = 300;

export default function ReactionPicker({ reactions, myDiscordId, onReact }: {
  reactions: Reaction[];
  myDiscordId?: string;
  onReact: (type: ReactionType) => void;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myReaction = myDiscordId ? reactions.find((r) => r.discordId === myDiscordId)?.type : undefined;

  const counts = REACTION_ORDER.reduce((acc, type) => {
    acc[type] = reactions.filter((r) => r.type === type).length;
    return acc;
  }, {} as Record<ReactionType, number>);
  const topType = REACTION_ORDER.reduce((top, type) => (counts[type] > counts[top] ? type : top), 'like' as ReactionType);
  const displayType = myReaction || (reactions.length > 0 ? topType : 'like');
  const DisplayIcon = REACTION_META[displayType].icon;

  const cancelClose = () => { if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; } };
  const scheduleClose = () => { cancelClose(); closeTimer.current = setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY); };

  const handleMainClick = () => onReact(myReaction || 'like');

  return (
    <div className="relative" onMouseEnter={() => { cancelClose(); setOpen(true); }} onMouseLeave={scheduleClose}>
      {open && (
        <div
          className="absolute bottom-full left-0 mb-2 flex items-center gap-1 bg-[#12121c]/95 backdrop-blur-xl border border-white/10 rounded-full px-1.5 py-1 shadow-2xl shadow-black/60 z-10 animate-in fade-in zoom-in-95 duration-150"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          {REACTION_ORDER.map((type) => {
            const meta = REACTION_META[type];
            const Icon = meta.icon;
            return (
              <button
                key={type}
                title={meta.label}
                onClick={() => { onReact(type); setOpen(false); }}
                className="p-1.5 rounded-full hover:scale-125 hover:bg-white/10 transition-transform"
              >
                <Icon className="w-4 h-4" style={{ color: meta.color }} />
              </button>
            );
          })}
        </div>
      )}

      <button onClick={handleMainClick} className="flex items-center gap-1.5 text-sm transition-colors group">
        <DisplayIcon
          className={`w-4 h-4 transition-all ${myReaction ? 'scale-110' : 'text-white/50 group-hover:text-violet-400'}`}
          style={myReaction ? { color: REACTION_META[myReaction].color, fill: myReaction === 'love' ? REACTION_META[myReaction].color : 'none' } : undefined}
        />
        <span className={myReaction ? '' : 'text-white/50'} style={myReaction ? { color: REACTION_META[myReaction].color } : undefined}>
          {reactions.length}
        </span>
      </button>
    </div>
  );
}
