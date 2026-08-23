'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, UserPlus, UserMinus, MessageSquare, Image as ImageIcon, Info } from 'lucide-react';
import { useOS } from '@/contexts/OSContext';
import { Tabs, EmptyState, Skeleton } from '@/components/os/ui';
import type { Profile } from './types';
import { useSocialPosts } from './useSocialPosts';
import VerifiedBadge from './VerifiedBadge';
import PostCard from './PostCard';

const VIOLET_ACCENT = '#8b5cf6';

type ProfileSubTab = 'posts' | 'photos' | 'info';

export default function ProfileTab({ discordId, me, onBack, onUpdatedSelf, onOpenProfile }: {
  discordId: string;
  me: Profile | null;
  onBack: () => void;
  onUpdatedSelf: (p: Profile) => void;
  onOpenProfile: (discordId: string) => void;
}) {
  const { openApp } = useOS();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ postsCount: 0, followersCount: 0, followingCount: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [messaging, setMessaging] = useState(false);
  const [subTab, setSubTab] = useState<ProfileSubTab>('posts');

  const load = useCallback(async () => {
    const res = await fetch(`/api/social/profile?discordId=${discordId}`, { cache: 'no-store' });
    const data = await res.json();
    if (data.success) {
      setProfile(data.profile);
      setStats(data.stats);
      setIsFollowing(data.isFollowing);
      setIsSelf(data.isSelf);
      setBio(data.profile.bio || '');
      setAvatarUrl(data.profile.avatarUrl || '');
      setCoverUrl(data.profile.coverUrl || '');
    }
  }, [discordId]);

  useEffect(() => { load(); }, [load]);

  const { posts, loading, react, toggleSave, share, sendComment, deletePost, reportPost, saveEdit } = useSocialPosts(`/api/social/posts?discordId=${discordId}`, me);
  const photoPosts = posts.filter((p) => p.imageUrl);

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

  const saveProfile = async () => {
    await fetch('/api/social/profile', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bio, avatarUrl, coverUrl }),
    });
    setEditing(false);
    await load();
    if (profile) onUpdatedSelf({ ...profile, bio, avatarUrl, coverUrl });
  };

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto py-6 px-4 space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
    );
  }
  const avatar = profile.avatarUrl || profile.avatar;

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm mb-3 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600/30 to-purple-700/30 relative">
        {profile.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.coverUrl} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="flex items-end justify-between -mt-8 px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt={profile.username} className="w-16 h-16 rounded-full border-4 border-[#0a0a0f]" />
        {isSelf ? (
          <button onClick={() => setEditing((v) => !v)} className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors">
            {editing ? 'Cancelar' : 'Editar perfil'}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={messageUser}
              disabled={messaging}
              title="Enviar mensaje"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggleFollow}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                isFollowing ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:opacity-90'
              }`}
            >
              {isFollowing ? <><UserMinus className="w-3.5 h-3.5" /> Dejar de seguir</> : <><UserPlus className="w-3.5 h-3.5" /> Seguir</>}
            </button>
          </div>
        )}
      </div>

      <div className="px-1 mt-2">
        <p className="text-white font-bold flex items-center gap-1.5">
          {profile.displayName}
          <VerifiedBadge verified={profile.verified} accountType={profile.accountType} />
        </p>
        <p className="text-white/40 text-sm">@{profile.username}</p>
        {!editing && profile.bio && <p className="text-white/60 text-sm mt-1">{profile.bio}</p>}

        {editing && (
          <div className="mt-2 space-y-2">
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Biografía..." maxLength={160} rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-violet-500/50" />
            <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="URL de foto de perfil..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
            <input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="URL de foto de portada..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
            <button onClick={saveProfile} className="px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 text-white text-xs font-semibold transition-opacity">
              Guardar
            </button>
          </div>
        )}

        <div className="flex items-center gap-4 mt-3 text-sm">
          <span className="text-white"><b>{stats.postsCount}</b> <span className="text-white/50">publicaciones</span></span>
          <span className="text-white"><b>{stats.followersCount}</b> <span className="text-white/50">seguidores</span></span>
          <span className="text-white"><b>{stats.followingCount}</b> <span className="text-white/50">seguidos</span></span>
        </div>
      </div>

      <div className="mt-5 mb-4">
        <Tabs
          tabs={[{ id: 'posts', label: 'Publicaciones' }, { id: 'photos', label: 'Fotos' }, { id: 'info', label: 'Información' }]}
          active={subTab}
          onChange={(id) => setSubTab(id as ProfileSubTab)}
          accent={VIOLET_ACCENT}
        />
      </div>

      {subTab === 'posts' && (
        loading ? (
          <div className="space-y-4"><Skeleton className="h-40 rounded-2xl" /></div>
        ) : posts.length === 0 ? (
          <EmptyState icon={ImageIcon} title="Todavía no hay publicaciones" />
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
        )
      )}

      {subTab === 'photos' && (
        photoPosts.length === 0 ? (
          <EmptyState icon={ImageIcon} title="Sin fotos todavía" />
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {photoPosts.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.id} src={p.imageUrl} alt="" className="w-full aspect-square object-cover rounded-lg" />
            ))}
          </div>
        )
      )}

      {subTab === 'info' && (
        profile.bio ? (
          <p className="text-white/70 text-sm">{profile.bio}</p>
        ) : (
          <EmptyState icon={Info} title="Sin información adicional" text={isSelf ? 'Agrega una biografía desde "Editar perfil".' : undefined} />
        )
      )}
    </div>
  );
}
