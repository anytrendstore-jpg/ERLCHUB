'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Building2, Phone, Mail, Globe, MapPin, Users } from 'lucide-react';
import { EmptyState, Skeleton, useToast } from '@/components/os/ui';
import type { Page, Profile } from './types';
import { useSocialPosts } from './useSocialPosts';
import Composer from './Composer';
import PostCard from './PostCard';
import VerifiedBadge from './VerifiedBadge';

export default function PageDetail({ pageId, me, onBack, onOpenProfile }: {
  pageId: string;
  me: Profile | null;
  onBack: () => void;
  onOpenProfile: (discordId: string) => void;
}) {
  const toast = useToast();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(`/api/social/pages/${pageId}`, { cache: 'no-store' });
    const data = await res.json();
    if (data.success) {
      setPage(data.page);
      setFollowing(data.page.isFollowing);
      setBio(data.page.bio || '');
      setPhone(data.page.phone || '');
      setEmail(data.page.email || '');
      setWebsite(data.page.website || '');
      setLocation(data.page.location || '');
    }
    setLoading(false);
  }, [pageId]);

  useEffect(() => { load(); }, [load]);

  const { posts, loading: postsLoading, publish, react, toggleSave, share, sendComment, deletePost, reportPost, saveEdit } =
    useSocialPosts(page ? `/api/social/posts?pageId=${pageId}` : null, me);

  const toggleFollow = async () => {
    if (!page) return;
    setFollowing((v) => !v);
    setPage((p) => p && { ...p, followersCount: p.followersCount + (following ? -1 : 1) });
    await fetch('/api/social/pages/follow', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pageId }),
    });
  };

  const saveDetails = async () => {
    await fetch(`/api/social/pages/${pageId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bio, phone, email, website, location }),
    });
    setEditing(false);
    toast.success('Página actualizada');
    await load();
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-6 px-4 space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
    );
  }

  if (!page) {
    return <EmptyState icon={Building2} title="No se encontró la página" />;
  }

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm mb-3 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600/30 to-purple-700/30 relative">
        {page.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={page.coverUrl} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="flex items-end justify-between -mt-8 px-4">
        {page.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={page.avatarUrl} alt={page.name} className="w-16 h-16 rounded-2xl border-4 border-[#0a0a0f] object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-2xl border-4 border-[#0a0a0f] bg-violet-600/30 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-violet-300" />
          </div>
        )}
        {page.isAdmin ? (
          <button onClick={() => setEditing((v) => !v)} className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors">
            {editing ? 'Cancelar' : 'Editar página'}
          </button>
        ) : (
          <button
            onClick={toggleFollow}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              following ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:opacity-90'
            }`}
          >
            {following ? 'Dejar de seguir' : 'Seguir'}
          </button>
        )}
      </div>

      <div className="px-1 mt-2">
        <p className="text-white font-bold flex items-center gap-1.5">
          {page.name}
          <VerifiedBadge verified={page.verified} accountType={page.verificationType} size="md" />
        </p>
        <p className="text-white/40 text-sm">{page.category}</p>
        {!editing && page.bio && <p className="text-white/60 text-sm mt-1.5">{page.bio}</p>}

        {editing && (
          <div className="mt-2 space-y-2">
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Descripción..." maxLength={300} rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-violet-500/50" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Teléfono..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Sitio web..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ubicación..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
            <button onClick={saveDetails} className="px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 text-white text-xs font-semibold transition-opacity">
              Guardar
            </button>
          </div>
        )}

        {!editing && (page.phone || page.email || page.website || page.location) && (
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-white/50">
            {page.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {page.phone}</span>}
            {page.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {page.email}</span>}
            {page.website && <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {page.website}</span>}
            {page.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {page.location}</span>}
          </div>
        )}

        <div className="flex items-center gap-4 mt-3 text-sm">
          <span className="text-white flex items-center gap-1"><Users className="w-3.5 h-3.5 text-white/40" /> <b>{page.followersCount}</b> <span className="text-white/50">seguidores</span></span>
          <span className="text-white"><b>{page.postsCount ?? posts.length}</b> <span className="text-white/50">publicaciones</span></span>
        </div>
      </div>

      <div className="mt-6">
        {page.isAdmin && (
          <Composer me={me} postingAs={{ name: page.name, avatarUrl: page.avatarUrl }} onPublish={(text, imageUrl) => publish(text, imageUrl, pageId)} />
        )}

        {postsLoading ? (
          <div className="space-y-4"><Skeleton className="h-40 rounded-2xl" /></div>
        ) : posts.length === 0 ? (
          <EmptyState icon={Building2} title="Sin publicaciones todavía" />
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
    </div>
  );
}
