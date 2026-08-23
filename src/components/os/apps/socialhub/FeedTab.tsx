'use client';

import { useCallback, useEffect, useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { Tabs, EmptyState, Skeleton, useToast } from '@/components/os/ui';
import type { Profile, StoryGroup } from './types';
import { useSocialPosts } from './useSocialPosts';
import StoriesBar from './StoriesBar';
import StoryViewer from './StoryViewer';
import AddStoryModal from './AddStoryModal';
import Composer from './Composer';
import PostCard from './PostCard';

const VIOLET_ACCENT = '#8b5cf6';
const STORY_POLL_MS = 10000;

export default function FeedTab({ me, onOpenProfile }: { me: Profile | null; onOpenProfile: (discordId: string) => void }) {
  const toast = useToast();
  const [feedTab, setFeedTab] = useState<'forYou' | 'following'>('forYou');
  const endpoint = feedTab === 'following' ? '/api/social/posts?feed=following' : '/api/social/posts';
  const { posts, loading, publish, toggleLike, toggleSave, share, sendComment, deletePost, reportPost, saveEdit } = useSocialPosts(endpoint, me);

  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [openStoryGroup, setOpenStoryGroup] = useState<StoryGroup | null>(null);
  const [openStoryIndex, setOpenStoryIndex] = useState(0);
  const [showAddStory, setShowAddStory] = useState(false);

  const loadStories = useCallback(async () => {
    const res = await fetch('/api/social/stories', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setStoryGroups(data.groups);
  }, []);

  useEffect(() => {
    loadStories();
    const interval = setInterval(loadStories, STORY_POLL_MS);
    return () => clearInterval(interval);
  }, [loadStories]);

  useEffect(() => {
    if (!openStoryGroup) return;
    const story = openStoryGroup.stories[openStoryIndex];
    if (!story) return;
    fetch('/api/social/stories/view', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storyId: story.id }),
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openStoryGroup?.discordId, openStoryIndex]);

  const publishStory = async (type: 'text' | 'image', content: string) => {
    const res = await fetch('/api/social/stories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, content }),
    });
    const data = await res.json();
    if (data.success) {
      setShowAddStory(false);
      await loadStories();
    } else {
      toast.error(data.error || 'No se pudo publicar la historia');
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      <Tabs
        tabs={[{ id: 'forYou', label: 'Para ti' }, { id: 'following', label: 'Siguiendo' }]}
        active={feedTab}
        onChange={(id) => setFeedTab(id as 'forYou' | 'following')}
        accent={VIOLET_ACCENT}
      />
      <div className="h-4" />

      <StoriesBar storyGroups={storyGroups} onAddStory={() => setShowAddStory(true)} onOpenStory={(g) => { setOpenStoryGroup(g); setOpenStoryIndex(0); }} />

      <Composer me={me} onPublish={publish} />

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title={feedTab === 'following' ? 'No sigues a nadie todavía' : 'Todavía no hay publicaciones'}
          text={feedTab === 'following' ? 'Sigue a otros jugadores para ver sus publicaciones acá.' : 'Sé el primero en publicar algo.'}
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              me={me}
              onOpenProfile={onOpenProfile}
              onToggleLike={toggleLike}
              onToggleSave={toggleSave}
              onShare={share}
              onSendComment={sendComment}
              onDelete={deletePost}
              onReport={reportPost}
              onSaveEdit={saveEdit}
            />
          ))}
        </div>
      )}

      {openStoryGroup && (
        <StoryViewer
          group={openStoryGroup}
          index={openStoryIndex}
          me={me}
          onClose={() => setOpenStoryGroup(null)}
          onIndexChange={setOpenStoryIndex}
        />
      )}

      {showAddStory && (
        <AddStoryModal onClose={() => setShowAddStory(false)} onPublish={publishStory} />
      )}
    </div>
  );
}
