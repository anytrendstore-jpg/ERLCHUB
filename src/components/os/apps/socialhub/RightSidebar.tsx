'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Users, CalendarDays } from 'lucide-react';
import { EmptyState, Skeleton } from '@/components/os/ui';

interface SuggestedPerson {
  discordId: string;
  username: string;
  displayName: string;
  avatar?: string;
  mutualCount: number;
}

/** Panel derecho: personas/páginas/grupos/eventos sugeridos. Páginas, grupos y eventos
 * todavía no existen como entidades reales (llegan en fases posteriores) — se muestran
 * con un estado vacío honesto en vez de contenido inventado. */
export default function RightSidebar({ onOpenProfile }: { onOpenProfile: (discordId: string) => void }) {
  const [people, setPeople] = useState<SuggestedPerson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/social/suggestions', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d.success) setPeople(d.people); })
      .finally(() => setLoading(false));
  }, []);

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
        <h3 className="text-white text-sm font-bold mb-3">Páginas y grupos sugeridos</h3>
        <EmptyState icon={Users} title="Todavía no hay sugerencias" text="Cuando existan páginas y grupos en HubSocial, van a aparecer acá." />
      </section>

      <section>
        <h3 className="text-white text-sm font-bold mb-3">Eventos próximos</h3>
        <EmptyState icon={CalendarDays} title="Sin eventos por ahora" />
      </section>
    </div>
  );
}
