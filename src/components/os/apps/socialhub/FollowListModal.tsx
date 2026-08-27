'use client';

import { useEffect, useState } from 'react';
import { UserPlus, UserMinus, Users } from 'lucide-react';
import { Modal, EmptyState, Skeleton } from '@/components/os/ui';
import VerifiedBadge from './VerifiedBadge';

interface FollowPerson {
  discordId: string;
  username: string;
  displayName: string;
  avatar?: string;
  verified?: boolean;
  accountType?: string;
  isFollowing: boolean;
  isSelf: boolean;
}

/** Lista de seguidores o seguidos de un perfil, con follow/unfollow directo desde la lista. */
export default function FollowListModal({ discordId, type, onClose, onOpenProfile }: {
  discordId: string;
  type: 'followers' | 'following';
  onClose: () => void;
  onOpenProfile: (discordId: string) => void;
}) {
  const [people, setPeople] = useState<FollowPerson[] | null>(null);

  useEffect(() => {
    fetch(`/api/social/follow/list?discordId=${discordId}&type=${type}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d.success) setPeople(d.people); else setPeople([]); })
      .catch(() => setPeople([]));
  }, [discordId, type]);

  const toggleFollow = async (targetId: string) => {
    setPeople((prev) => prev && prev.map((p) => (p.discordId === targetId ? { ...p, isFollowing: !p.isFollowing } : p)));
    await fetch('/api/social/follow', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetId }),
    }).catch(() => {});
  };

  return (
    <Modal title={type === 'followers' ? 'Seguidores' : 'Seguidos'} onClose={onClose} size="sm">
      {people === null ? (
        <div className="space-y-3">
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
        </div>
      ) : people.length === 0 ? (
        <EmptyState
          icon={Users}
          title={type === 'followers' ? 'Todavía sin seguidores' : 'Todavía no sigue a nadie'}
        />
      ) : (
        <div className="space-y-1 -mx-1.5">
          {people.map((p) => (
            <div key={p.discordId} className="flex items-center gap-2.5 px-1.5 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors">
              <button onClick={() => { onOpenProfile(p.discordId); onClose(); }} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.avatar} alt="" className="w-10 h-10 rounded-full flex-shrink-0 ring-1 ring-white/10 object-cover" />
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-white text-sm font-medium truncate">
                    {p.displayName}
                    <VerifiedBadge verified={p.verified} accountType={p.accountType} />
                  </span>
                  <span className="block text-white/40 text-xs truncate">@{p.username}</span>
                </span>
              </button>
              {!p.isSelf && (
                <button
                  onClick={() => toggleFollow(p.discordId)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex-shrink-0 ${
                    p.isFollowing
                      ? 'bg-white/[0.07] border border-white/10 hover:bg-white/[0.12] text-white'
                      : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:shadow-[0_0_16px_-4px_rgba(217,70,239,0.5)]'
                  }`}
                >
                  {p.isFollowing ? <><UserMinus className="w-3.5 h-3.5" /> Siguiendo</> : <><UserPlus className="w-3.5 h-3.5" /> Seguir</>}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
