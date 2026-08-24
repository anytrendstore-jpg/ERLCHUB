'use client';

import { Plus } from 'lucide-react';
import type { StoryGroup } from './types';

export default function StoriesBar({ storyGroups, onAddStory, onOpenStory }: {
  storyGroups: StoryGroup[];
  onAddStory: () => void;
  onOpenStory: (group: StoryGroup) => void;
}) {
  return (
    <div className="flex gap-4 mb-6 overflow-x-auto pb-1">
      <button onClick={onAddStory} className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/15 flex items-center justify-center group-hover:border-violet-400/60 group-hover:bg-violet-500/5 transition-all duration-200">
          <Plus className="w-5 h-5 text-white/40 group-hover:text-violet-300 transition-colors" />
        </div>
        <span className="text-white/40 text-[10px] group-hover:text-white/60 transition-colors">Tu historia</span>
      </button>
      {storyGroups.map((g) => (
        <button key={g.discordId} onClick={() => onOpenStory(g)} className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
          <div
            className={`w-16 h-16 rounded-full p-[2.5px] transition-transform duration-200 group-hover:scale-105 ${
              g.hasUnseen ? 'bg-[conic-gradient(from_-45deg,#a78bfa,#d946ef,#67e8f9,#a78bfa)] shadow-[0_0_16px_-2px_rgba(168,85,247,0.5)]' : 'bg-white/10'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.avatar} alt={g.displayName} className="w-full h-full rounded-full object-cover border-2 border-[#0a0a0f]" />
          </div>
          <span className="text-white/60 text-[10px] max-w-[60px] truncate group-hover:text-white/80 transition-colors">{g.displayName}</span>
        </button>
      ))}
    </div>
  );
}
