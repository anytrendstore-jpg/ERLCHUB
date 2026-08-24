'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, UserPlus, UserMinus, MessageSquare, Grid3x3, Link as LinkIcon } from 'lucide-react';
import { useOS } from '@/contexts/OSContext';
import { EmptyState, Skeleton } from '@/components/os/ui';
import type { Post, Profile } from './types';
import { useSocialPosts } from './useSocialPosts';
import VerifiedBadge from './VerifiedBadge';
import EditProfileModal from './EditProfileModal';
import ProfileGrid from './ProfileGrid';
import PostDetailModal from './PostDetailModal';

export default function ProfileTab({ discordId, me, onBack, onUpdatedSelf, onOpenProfile, onOpenPage }: {
  discordId: string;
  me: Profile | null;
  onBack: () => void;
  onUpdatedSelf: (p: Profile) => void;
  onOpenProfile: (discordId: string) => void;
  onOpenPage: (pageId: string) => void;
}) {
  const { openApp } = useOS();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ postsCount: 0, followersCount: 0, followingCount: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  const [editing, setEditing] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [openPost, setOpenPost] = useState<Post | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/social/profile?discordId=${discordId}`, { cache: 'no-store' });
    const data = await res.json();
    if (data.success) {
      setProfile(data.profile);
      setStats(data.stats);
      setIsFollowing(data.isFollowing);
      setIsSelf(data.isSelf);
    }
  }, [discordId]);

  useEffect(() => { load(); }, [load]);

  const { posts, loading, react, toggleSave, share, sendComment, deletePost, reportPost, saveEdit } = useSocialPosts(`/api/social/posts?discordId=${discordId}`, me);

  // Mientras el modal de detalle está abierto, seguir mostrando la versión más nueva de ese post
  // (con reacciones/comentarios actualizados) en vez de la copia congelada del momento del clic.
  const liveOpenPost = openPost ? posts.find((p) => p.id === openPost.id) || openPost : null;

  const toggleFollow = async () => {
    setIsFollowing((v) => !v);
    setStats((s) => ({ ...s, followersCount: s.followersCount + (isFollowing ? -1 : 1) }));
    await fetch('/api/social/follow', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetId: discordId }),
    });
  };

  const messageUser = async () => {
    setMessaging(true);
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ participantIds: [discordId] }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('hubchat_open_conversation', data.conversation.id);
        openApp('hubchat');
      }
    } finally {
      setMessaging(false);
    }
  };

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto py-6 px-4 space-y-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }
  const avatar = profile.avatarUrl || profile.avatar;

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="flex items-start gap-6 sm:gap-10 mb-6">
        <div className="relative flex-shrink-0">
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 opacity-60 blur-md" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar} alt={profile.username} className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-[#0a0a0f]" />
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-3 flex-wrap mb-3">
            <h1 className="text-white text-lg font-bold flex items-center gap-1.5 flex-wrap">
              {profile.displayName}
              <VerifiedBadge verified={profile.verified} accountType={profile.accountType} size="md" />
              {profile.title && (
                <span className="text-violet-400/90 text-sm font-medium">
                  <span className="text-white/30 font-normal mx-0.5">·</span>{profile.title}
                </span>
              )}
            </h1>

            {isSelf ? (
              <button onClick={() => setEditing(true)} className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors">
                Editar perfil
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleFollow}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isFollowing ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:opacity-90'
                  }`}
                >
                  {isFollowing ? <><UserMinus className="w-3.5 h-3.5" /> Dejar de seguir</> : <><UserPlus className="w-3.5 h-3.5" /> Seguir</>}
                </button>
                <button
                  onClick={messageUser}
                  disabled={messaging}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Mensaje
                </button>
              </div>
            )}
          </div>

          <p className="text-white/40 text-sm mb-3">@{profile.username}</p>

          <div className="flex items-center gap-6 mb-3">
            <span className="text-sm"><b className="text-white">{stats.postsCount}</b> <span className="text-white/50">publicaciones</span></span>
            <span className="text-sm"><b className="text-white">{stats.followersCount}</b> <span className="text-white/50">seguidores</span></span>
            <span className="text-sm"><b className="text-white">{stats.followingCount}</b> <span className="text-white/50">seguidos</span></span>
          </div>

          {profile.bio && <p className="text-white/70 text-sm whitespace-pre-wrap leading-relaxed">{profile.bio}</p>}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-violet-400 hover:text-violet-300 text-sm mt-1.5 transition-colors">
              <LinkIcon className="w-3.5 h-3.5" /> {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 py-3 border-t border-b border-white/10 mb-4 text-white/60 text-xs font-semibold uppercase tracking-wider">
        <Grid3x3 className="w-4 h-4" /> Publicaciones
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-sm" />)}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState icon={Grid3x3} title="Todavía no hay publicaciones" text={isSelf ? 'Cuando publiques algo, va a aparecer acá.' : undefined} />
      ) : (
        <ProfileGrid posts={posts} onOpenPost={setOpenPost} />
      )}

      {editing && profile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={(patch) => {
            const updated = { ...profile, ...patch };
            setProfile(updated);
            onUpdatedSelf(updated);
          }}
        />
      )}

      {liveOpenPost && (
        <PostDetailModal
          post={liveOpenPost}
          me={me}
          onClose={() => setOpenPost(null)}
          onOpenProfile={onOpenProfile}
          onOpenPage={onOpenPage}
          onReact={react}
          onToggleSave={toggleSave}
          onShare={share}
          onSendComment={sendComment}
          onDelete={(postId) => { deletePost(postId); setOpenPost(null); }}
          onReport={reportPost}
          onSaveEdit={saveEdit}
        />
      )}
    </div>
  );
}
