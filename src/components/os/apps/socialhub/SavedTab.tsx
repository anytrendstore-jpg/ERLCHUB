'use client';

import { Bookmark } from 'lucide-react';
import { EmptyState, Skeleton } from '@/components/os/ui';
import type { Profile } from './types';
import { useSocialPosts } from './useSocialPosts';
import PostCard from './PostCard';

export default function SavedTab({ me, onOpenProfile }: { me: Profile | null; onOpenProfile: (discordId: string) => void }) {
  const { posts, loading, react, toggleSave, share, sendComment, deletePost, reportPost, saveEdit } = useSocialPosts('/api/social/posts?saved=1', me);

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      <h1 className="text-white text-xl font-bold mb-4">Guardados</h1>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState icon={Bookmark} title="No has guardado nada todavía" text="Tocá el ícono de guardar en cualquier publicación para verla acá." />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              me={me}
              onOpenProfile={onOpenProfile}
              onReact={react}
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
    </div>
  );
}
