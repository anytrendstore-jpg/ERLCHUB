'use client';

import { X, Eye } from 'lucide-react';
import type { StoryGroup, Profile } from './types';
import { timeAgo } from './types';

export default function StoryViewer({ group, index, me, onClose, onIndexChange }: {
  group: StoryGroup;
  index: number;
  me: Profile | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const story = group.stories[index];
  if (!story) { onClose(); return null; }
  const isLast = index === group.stories.length - 1;
  const isMineStory = me?.discordId === story.discordId;

  return (
    <div className="absolute inset-0 bg-black z-[3000] flex items-center justify-center" onClick={onClose}>
      <div
        className="relative w-full max-w-sm h-[80vh] rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ background: story.type === 'text' ? story.backgroundColor : '#000' }}
      >
        <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
          {group.stories.map((s, i) => (
            <div key={s.id} className={`flex-1 h-0.5 rounded-full ${i <= index ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>
        <div className="absolute top-6 left-3 flex items-center gap-2 z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={story.avatar} alt="" className="w-7 h-7 rounded-full" />
          <span className="text-white text-xs font-medium drop-shadow">{story.displayName}</span>
          <span className="text-white/60 text-[10px]">{timeAgo(story.createdAt)}</span>
        </div>
        <button onClick={onClose} className="absolute top-6 right-3 text-white/80 hover:text-white z-10"><X className="w-5 h-5" /></button>

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
          onClick={() => (isLast ? onClose() : onIndexChange(index + 1))}
          className="absolute right-0 top-0 h-full w-1/2"
        />
        {index > 0 && (
          <button onClick={() => onIndexChange(index - 1)} className="absolute left-0 top-0 h-full w-1/2" />
        )}
      </div>
    </div>
  );
}
