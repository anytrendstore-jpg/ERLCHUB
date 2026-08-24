'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Building2, Users, CalendarDays } from 'lucide-react';
import { EmptyState, Skeleton } from '@/components/os/ui';
import VerifiedBadge from './VerifiedBadge';

interface SuggestedPerson {
  discordId: string;
  username: string;
  displayName: string;
  avatar?: string;
  mutualCount: number;
}

interface SuggestedPage {
  id: string;
  name: string;
  category: string;
  avatarUrl?: string;
  verified: boolean;
  verificationType?: string;
  followersCount: number;
}

interface SuggestedGroup {
  id: string;
  name: string;
  category?: string;
  icon?: string;
  memberCount: number;
}

/** Panel derecho: personas/páginas/grupos/eventos sugeridos. Eventos todavía no existe
 * como entidad real (llega en una fase posterior) — se muestra con un estado vacío
 * honesto en vez de contenido inventado. Páginas y grupos ya son reales. */
export default function RightSidebar({ onOpenProfile, onOpenPage, onOpenGroup }: { onOpenProfile: (discordId: string) => void; onOpenPage: (pageId: string) => void; onOpenGroup: (groupId: string) => void }) {
  const [people, setPeople] = useState<SuggestedPerson[]>([]);
  const [pages, setPages] = useState<SuggestedPage[]>([]);
  const [groups, setGroups] = useState<SuggestedGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/social/suggestions', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d.success) { setPeople(d.people); setPages(d.pages || []); setGroups(d.groups || []); } })
      .finally(() => setLoading(false));
  }, []);

  const followPage = async (pageId: string) => {
    setPages((prev) => prev.filter((p) => p.id !== pageId));
    await fetch('/api/social/pages/follow', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pageId }),
    }).catch(() => {});
  };

  const joinGroup = async (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    await fetch('/api/social/groups/membership', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ groupId, action: 'join' }),
    }).catch(() => {});
  };

  const follow = async (discordId: string) => {
    setPeople((prev) => prev.filter((p) => p.discordId !== discordId));
    await fetch('/api/social/follow', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetId: discordId }),
    }).catch(() => {});
  };

  return (
    <div className="hidden lg:flex w-72 h-full border-l border-white/5 bg-[#0d0d14] overflow-y-auto flex-shrink-0 flex-col p-4 gap-6">
      <section>
        <h3 className="text-white text-sm font-bold mb-3">Personas que quizás conozcas</h3>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
        ) : people.length === 0 ? (
          <p className="text-white/30 text-xs">Todavía no hay sugerencias para vos.</p>
        ) : (
          <div className="space-y-3">
            {people.map((p) => (
              <div key={p.discordId} className="flex items-center gap-2.5">
                <button onClick={() => onOpenProfile(p.discordId)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.avatar} alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-white text-xs font-medium truncate">{p.displayName}</span>
                    <span className="block text-white/40 text-[10px] truncate">
                      {p.mutualCount > 0 ? `${p.mutualCount} amigos en común` : `@${p.username}`}
                    </span>
                  </span>
                </button>
                <button
                  onClick={() => follow(p.discordId)}
                  title="Seguir"
                  className="p-1.5 rounded-full bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 transition-colors flex-shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-white text-sm font-bold mb-3">Páginas sugeridas</h3>
        {loading ? (
          <Skeleton className="h-9" />
        ) : pages.length === 0 ? (
          <p className="text-white/30 text-xs">Todavía no hay páginas para sugerir.</p>
        ) : (
          <div className="space-y-3">
            {pages.map((p) => (
              <div key={p.id} className="flex items-center gap-2.5">
                <button onClick={() => onOpenPage(p.id)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                  {p.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.avatarUrl} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-violet-600/20 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-violet-400" />
                    </div>
                  )}
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 text-white text-xs font-medium truncate">
                      {p.name} <VerifiedBadge verified={p.verified} accountType={p.verificationType} />
                    </span>
                    <span className="block text-white/40 text-[10px] truncate">{p.category}</span>
                  </span>
                </button>
                <button
                  onClick={() => followPage(p.id)}
                  title="Seguir"
                  className="p-1.5 rounded-full bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 transition-colors flex-shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-white text-sm font-bold mb-3">Grupos sugeridos</h3>
        {loading ? (
          <Skeleton className="h-9" />
        ) : groups.length === 0 ? (
          <p className="text-white/30 text-xs">Todavía no hay grupos para sugerir.</p>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => (
              <div key={g.id} className="flex items-center gap-2.5">
                <button onClick={() => onOpenGroup(g.id)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                  {g.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.icon} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-violet-600/20 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-violet-400" />
                    </div>
                  )}
                  <span className="min-w-0">
                    <span className="block text-white text-xs font-medium truncate">{g.name}</span>
                    <span className="block text-white/40 text-[10px] truncate">{g.category || `${g.memberCount} miembros`}</span>
                  </span>
                </button>
                <button
                  onClick={() => joinGroup(g.id)}
                  title="Unirme"
                  className="p-1.5 rounded-full bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 transition-colors flex-shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-white text-sm font-bold mb-3">Eventos próximos</h3>
        <EmptyState icon={CalendarDays} title="Sin eventos por ahora" />
      </section>
    </div>
  );
}
