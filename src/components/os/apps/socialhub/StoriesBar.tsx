'use client';

import { Plus } from 'lucide-react';
import type { StoryGroup } from './types';

export default function StoriesBar({ storyGroups, onAddStory, onOpenStory }: {
  storyGroups: StoryGroup[];
  onAddStory: () => void;
  onOpenStory: (group: StoryGroup) => void;
}) {
  return (
    <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
      <button onClick={onAddStory} className="flex flex-col items-center gap-1.5 flex-shrink-0">
        <div className="w-14 h-14 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center hover:border-violet-500/50 transition-colors">
          <Plus className="w-5 h-5 text-white/40" />
        </div>
        <span className="text-white/40 text-[10px]">Tu historia</span>
      </button>
      {storyGroups.map((g) => (
        <button key={g.discordId} onClick={() => onOpenStory(g)} className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div className={`w-14 h-14 rounded-full p-0.5 ${g.hasUnseen ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-white/10'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.avatar} alt={g.displayName} className="w-full h-full rounded-full object-cover border-2 border-[#0a0a0f]" />
          </div>
          <span className="text-white/60 text-[10px] max-w-[56px] truncate">{g.displayName}</span>
        </button>
      ))}
    </div>
  );
}
