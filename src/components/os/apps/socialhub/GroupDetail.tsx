'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Users, Lock, Globe, Check, X, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { EmptyState, Skeleton, useToast } from '@/components/os/ui';
import ImageUploadButton from '@/components/ImageUploadButton';
import type { Group, GroupMember, Profile } from './types';
import { useSocialPosts } from './useSocialPosts';
import Composer from './Composer';
import PostCard from './PostCard';

export default function GroupDetail({ groupId, me, onBack, onOpenProfile, onOpenPage }: {
  groupId: string;
  me: Profile | null;
  onBack: () => void;
  onOpenProfile: (discordId: string) => void;
  onOpenPage: (pageId: string) => void;
}) {
  const toast = useToast();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [pending, setPending] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [icon, setIcon] = useState('');
  const [coverImage, setCoverImage] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(`/api/social/groups/${groupId}`, { cache: 'no-store' });
    const data = await res.json();
    if (data.success) {
      setGroup(data.group);
      setDescription(data.group.description || '');
      setCategory(data.group.category || '');
      setIcon(data.group.icon || '');
      setCoverImage(data.group.coverImage || '');
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  const isActiveMember = Boolean(group?.myRole);
  const canSeeFeed = Boolean(group && (group.privacy === 'public' || isActiveMember));

  const { posts, loading: postsLoading, publish, react, toggleSave, share, sendComment, deletePost, reportPost, saveEdit } =
    useSocialPosts(group && canSeeFeed ? `/api/social/posts?groupId=${groupId}` : null, me);

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const res = await fetch(`/api/social/groups/${groupId}/members`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) { setMembers(data.members); setPending(data.pending); }
    } finally {
      setMembersLoading(false);
    }
  }, [groupId]);

  useEffect(() => { if (showMembers) loadMembers(); }, [showMembers, loadMembers]);

  const membership = async (action: 'join' | 'leave', targetId?: string) => {
    setBusy(true);
    try {
      const res = await fetch('/api/social/groups/membership', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ groupId, action, targetId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(action === 'join' ? (data.status === 'pending' ? 'Solicitud enviada' : 'Te uniste al grupo') : 'Abandonaste el grupo');
        await load();
      } else {
        toast.error(data.error || 'No se pudo procesar');
      }
    } finally {
      setBusy(false);
    }
  };

  const decide = async (targetId: string, action: 'approve' | 'reject') => {
    await fetch('/api/social/groups/membership', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ groupId, action, targetId }),
    });
    toast.success(action === 'approve' ? 'Solicitud aprobada' : 'Solicitud rechazada');
    loadMembers();
    load();
  };

  const saveDetails = async () => {
    await fetch(`/api/social/groups/${groupId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description, category, icon, coverImage }),
    });
    setEditing(false);
    toast.success('Grupo actualizado');
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

  if (!group) {
    return <EmptyState icon={Users} title="No se encontró el grupo" />;
  }

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm mb-3 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600/30 to-purple-700/30 relative">
        {group.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={group.coverImage} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="flex items-end justify-between -mt-8 px-4">
        {group.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={group.icon} alt={group.name} className="w-16 h-16 rounded-2xl border-4 border-[#0a0a0f] object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-2xl border-4 border-[#0a0a0f] bg-violet-600/30 flex items-center justify-center">
            <Users className="w-7 h-7 text-violet-300" />
          </div>
        )}
        <div className="flex items-center gap-2">
          {group.isAdmin && (
            <button onClick={() => setEditing((v) => !v)} className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors">
              {editing ? 'Cancelar' : 'Editar'}
            </button>
          )}
          {!group.myRole && !group.isPending && (
            <button
              disabled={busy}
              onClick={() => membership('join')}
              className="px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white text-xs font-semibold transition-opacity"
            >
              {group.privacy === 'private' ? 'Solicitar unirme' : 'Unirme'}
            </button>
          )}
          {group.isPending && (
            <span className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold">Solicitud enviada</span>
          )}
          {group.myRole && group.myRole !== 'owner' && (
            <button
              disabled={busy}
              onClick={() => membership('leave')}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
            >
              Abandonar
            </button>
          )}
        </div>
      </div>

      <div className="px-1 mt-2">
        <p className="text-white font-bold flex items-center gap-1.5">
          {group.name}
          {group.privacy === 'private' ? <Lock className="w-3.5 h-3.5 text-white/30" /> : <Globe className="w-3.5 h-3.5 text-white/30" />}
        </p>
        <p className="text-white/40 text-sm">{group.category || (group.privacy === 'private' ? 'Grupo privado' : 'Grupo público')}</p>
        {!editing && group.description && <p className="text-white/60 text-sm mt-1.5">{group.description}</p>}

        {editing && (
          <div className="mt-2 space-y-2">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción..." maxLength={300} rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-violet-500/50" />
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Categoría..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
            <div className="flex items-center gap-2">
              <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="URL de ícono..."
                className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
              <ImageUploadButton aspect={1} shape="rect" onUploaded={setIcon} onError={toast.error} />
            </div>
            <div className="flex items-center gap-2">
              <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="URL de portada..."
                className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
              <ImageUploadButton aspect={3} shape="rect" onUploaded={setCoverImage} onError={toast.error} />
            </div>
            <button onClick={saveDetails} className="px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 text-white text-xs font-semibold transition-opacity">
              Guardar
            </button>
          </div>
        )}

        <button onClick={() => setShowMembers((v) => !v)} className="flex items-center gap-2 mt-3 text-sm text-white hover:text-violet-300 transition-colors">
          <Users className="w-3.5 h-3.5 text-white/40" /> <b>{group.memberCount}</b> <span className="text-white/50">miembro{group.memberCount === 1 ? '' : 's'}</span>
          {showMembers ? <ChevronUp className="w-3.5 h-3.5 text-white/40" /> : <ChevronDown className="w-3.5 h-3.5 text-white/40" />}
        </button>

        {showMembers && (
          <div className="mt-3 space-y-4">
            {group.isAdmin && (
              <div>
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">
                  Solicitudes pendientes {pending.length > 0 && `(${pending.length})`}
                </p>
                {membersLoading ? (
                  <Skeleton className="h-9" />
                ) : pending.length === 0 ? (
                  <p className="text-white/30 text-xs">No hay solicitudes pendientes.</p>
                ) : (
                  <div className="space-y-2">
                    {pending.map((p) => (
                      <div key={p.discordId} className="flex items-center gap-2.5 bg-white/5 rounded-xl p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.avatar} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                        <span className="flex-1 min-w-0 text-white text-xs font-medium truncate">{p.displayName}</span>
                        <button onClick={() => decide(p.discordId, 'approve')} title="Aprobar" className="p-1.5 rounded-full bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => decide(p.discordId, 'reject')} title="Rechazar" className="p-1.5 rounded-full bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Miembros</p>
              {membersLoading ? (
                <Skeleton className="h-9" />
              ) : (
                <div className="space-y-2">
                  {members.map((m) => (
                    <button key={m.discordId} onClick={() => onOpenProfile(m.discordId)} className="w-full flex items-center gap-2.5 hover:bg-white/5 rounded-xl p-2 -mx-2 transition-colors text-left">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.avatar} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                      <span className="flex-1 min-w-0 text-white text-xs font-medium truncate">{m.displayName}</span>
                      {m.role !== 'member' && (
                        <span className="flex items-center gap-1 text-[10px] text-violet-400/80">
                          <Shield className="w-3 h-3" /> {m.role === 'owner' ? 'Dueño' : m.role === 'admin' ? 'Admin' : 'Moderador'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        {!canSeeFeed ? (
          <EmptyState icon={Lock} title="Este grupo es privado" text="Unite para ver sus publicaciones." />
        ) : (
          <>
            {isActiveMember && <Composer me={me} onPublish={(text, imageUrl) => publish(text, imageUrl, undefined, groupId)} />}

            {postsLoading ? (
              <div className="space-y-4"><Skeleton className="h-40 rounded-2xl" /></div>
            ) : posts.length === 0 ? (
              <EmptyState icon={Users} title="Sin publicaciones todavía" />
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    me={me}
                    onOpenProfile={onOpenProfile}
                    onOpenPage={onOpenPage}
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
          </>
        )}
      </div>
    </div>
  );
}
